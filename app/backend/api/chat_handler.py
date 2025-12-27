"""
Chat handler for POST /chat endpoint.
Orchestrates the complete chat flow: profile lookup, chart generation/caching, AI response.
"""

import json
import logging
import os
import time
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

# Import common utilities
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from common.api_wrapper import api_handler  # noqa: E402
from common.astrology_client import AstrologyClient, AstrologyAPIError  # noqa: E402
from common.bedrock_client import BedrockClient, BedrockError  # noqa: E402

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
dynamodb = boto3.resource("dynamodb")
s3_client = boto3.client("s3")

# Table and bucket names from environment
PROFILES_TABLE = os.environ.get("DYNAMODB_PROFILES_TABLE", "mira-user-profiles-dev")
CONVERSATIONS_TABLE = os.environ.get("DYNAMODB_CONVERSATIONS_TABLE", "mira-conversations-dev")
CHARTS_BUCKET = os.environ.get("S3_CHARTS_BUCKET", "mira-dev-artifacts")

# Cache TTL (30 days in seconds)
CHART_CACHE_TTL = 30 * 24 * 60 * 60

# Initialize clients
astrology_client = AstrologyClient()
bedrock_client = BedrockClient()


def extract_user_id_from_event(event: Dict[str, Any]) -> str:
    """Extract user_id from JWT claims."""
    try:
        if "raw_event" in event:
            event = event["raw_event"]

        authorizer = event["requestContext"]["authorizer"]

        if "jwt" in authorizer:
            claims = authorizer["jwt"]["claims"]
        else:
            claims = authorizer["claims"]

        user_id = claims["sub"]
        logger.info(f"Extracted user_id: {user_id}")
        return user_id

    except (KeyError, TypeError) as e:
        logger.error(f"Failed to extract user_id: {e}")
        raise ValueError("Unable to extract user identity from request")


@api_handler
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for POST /chat endpoint.

    Request:
    {
        "message": "What does my chart say about my career?"
    }

    Response:
    {
        "message": "AI generated response...",
        "chart_url": "https://s3.../charts/user123/1763849357.svg",
        "conversation_id": "conv-uuid"
    }
    """
    logger.info("Chat request received")

    # Extract user_id
    try:
        user_id = extract_user_id_from_event(event)
    except ValueError as e:
        return {
            "statusCode": 401,
            "body": json.dumps({"error": {"code": "UNAUTHORIZED", "message": str(e)}}),
        }

    # Parse request body
    body = event.get("body_json", {})
    if not body:
        body = event.get("parsed_body", {})

    user_message = body.get("message", "").strip()
    conversation_id = body.get("conversation_id")

    if not user_message:
        return {
            "statusCode": 400,
            "body": json.dumps(
                {
                    "error": {
                        "code": "MISSING_MESSAGE",
                        "message": "Message field is required",
                    }
                }
            ),
        }

    logger.info(f"User message: {user_message[:100]}...")

    # Step 1: Get user profile
    try:
        user_profile = get_user_profile(user_id)
        if not user_profile:
            return {
                "statusCode": 404,
                "body": json.dumps(
                    {
                        "error": {
                            "code": "PROFILE_NOT_FOUND",
                            "message": "User profile not found. Please create a profile first.",
                        }
                    }
                ),
            }

        logger.info(f"User profile loaded: {user_profile.get('zodiac_sign')}")
    except Exception as e:
        logger.error(f"Failed to get user profile: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "error": {
                        "code": "PROFILE_ERROR",
                        "message": "Failed to retrieve user profile",
                    }
                }
            ),
        }

    # Step 2: Check for cached chart
    chart_data, chart_url, is_cache_hit = get_or_generate_chart(user_id, user_profile)

    if not chart_data:
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "error": {
                        "code": "CHART_ERROR",
                        "message": "Failed to generate or retrieve chart",
                    }
                }
            ),
        }

    logger.info(f"Chart {'retrieved from cache' if is_cache_hit else 'generated'}")

    # Step 3: Generate AI response
    try:
        ai_result = bedrock_client.generate_response(
            user_profile=user_profile, chart_data=chart_data, user_question=user_message
        )

        ai_response = ai_result["response"]
        logger.info(f"AI response generated ({len(ai_response)} chars)")

    except BedrockError as e:
        logger.error(f"Bedrock error: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "error": {
                        "code": "AI_ERROR",
                        "message": "Failed to generate AI response",
                    }
                }
            ),
        }

    # Step 4: Save conversation
    try:
        result_conversation_id = save_conversation(
            user_id=user_id,
            conversation_id=conversation_id,
            user_message=user_message,
            ai_response=ai_response,
            chart_url=chart_url,
        )
        logger.info(f"Conversation saved: {result_conversation_id}")
    except Exception as e:
        logger.error(f"Failed to save conversation: {e}")
        # Don't fail the request, just log the error
        result_conversation_id = None

    # Success response
    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "conversation_id": result_conversation_id,
                "message": ai_response,
                "chart_url": chart_url,
            }
        ),
    }


def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user profile from DynamoDB."""
    table = dynamodb.Table(PROFILES_TABLE)

    try:
        response = table.get_item(Key={"user_id": user_id})
        return response.get("Item")
    except ClientError as e:
        logger.error(f"DynamoDB error getting profile: {e}")
        raise


def get_or_generate_chart(user_id: str, user_profile: Dict[str, Any]) -> tuple[Optional[Dict], Optional[str], bool]:
    """
    Get cached chart or generate new one.

    Returns:
        (chart_data, chart_url, is_cache_hit)
    """
    # Check cache
    chart_s3_path = user_profile.get("chart_s3_path")
    chart_generated_at = user_profile.get("chart_generated_at")
    cached_chart_data = user_profile.get("chart_data_cached")

    if cached_chart_data and isinstance(cached_chart_data, str):
        cached_chart_data = json.loads(cached_chart_data)

    current_time = int(time.time())
    is_cache_valid = False

    if chart_s3_path and chart_generated_at and cached_chart_data:
        age_seconds = current_time - chart_generated_at
        if age_seconds < CHART_CACHE_TTL:
            is_cache_valid = True
            logger.info(f"Cache hit - chart age: {age_seconds / 86400:.1f} days")

    # Cache Hit - use cached data
    if is_cache_valid:
        chart_url = generate_presigned_chart_url(CHARTS_BUCKET, chart_s3_path)

        logger.info(f"Cached chart data type: {type(cached_chart_data)}")
        logger.info(
            f"Cached chart keys: {list(cached_chart_data.keys()) if isinstance(cached_chart_data, dict) else 'N/A'}"
        )
        logger.info(f"Chart data sample: {json.dumps(cached_chart_data, default=str)[:500]}...")

        return cached_chart_data, chart_url, True

    # Cache Miss - generate new chart
    logger.info("Cache miss - generating new chart")

    try:
        # Generate chart
        chart_result = astrology_client.get_birth_chart(user_profile)
        chart_data = chart_result["chart_data"]
        svg_content = chart_result["svg_content"]

        # Save to S3
        timestamp = current_time
        s3_key = f"charts/{user_id}/{timestamp}.svg"

        s3_client.put_object(
            Bucket=CHARTS_BUCKET,
            Key=s3_key,
            Body=svg_content,
            ContentType="image/svg+xml",
        )

        chart_url = generate_presigned_chart_url(CHARTS_BUCKET, s3_key)
        logger.info(f"Chart saved to S3: {s3_key}")

        # Update user profile with chart metadata
        update_profile_with_chart(user_id, s3_key, timestamp, chart_data)

        return chart_data, chart_url, False

    except AstrologyAPIError as e:
        logger.error(f"Failed to generate chart: {e}")
        return None, None, False
    except Exception as e:
        logger.error(f"Unexpected error during chart generation: {e}")
        return None, None, False


def update_profile_with_chart(user_id: str, s3_path: str, timestamp: int, chart_data: Dict[str, Any]) -> None:
    """Update user profile with chart metadata."""
    table = dynamodb.Table(PROFILES_TABLE)

    chart_data_str = json.dumps(chart_data)

    try:
        table.update_item(
            Key={"user_id": user_id},
            UpdateExpression=(
                "SET chart_s3_path = :path, chart_generated_at = :ts, "
                "chart_data_cached = :data, updated_at = :updated"
            ),
            ExpressionAttributeValues={
                ":path": s3_path,
                ":ts": timestamp,
                ":data": chart_data_str,
                ":updated": timestamp,
            },
        )
        logger.info(f"Profile updated with chart metadata for user: {user_id}")
    except ClientError as e:
        logger.error(f"Failed to update profile with chart metadata: {e}")
        raise


def generate_presigned_chart_url(bucket: str, s3_key: str, expiration: int = 86400) -> str:
    """Generate presigned URL for private S3 chart access."""
    try:
        url = s3_client.generate_presigned_url(
            "get_object", Params={"Bucket": bucket, "Key": s3_key}, ExpiresIn=expiration
        )
        logger.info(f"Generated presigned URL (expires in {expiration}s)")
        return url
    except Exception as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return f"https://{bucket}.s3.amazonaws.com/{s3_key}"


def save_conversation(
    user_id: str,
    conversation_id: Optional[str],
    user_message: str,
    ai_response: str,
    chart_url: Optional[str],
) -> str:
    """
    Save conversation message to DynamoDB using thread-based schema.

    If conversation_id is provided:
        - Validates conversation exists and user owns it
        - Saves message to existing conversation
        - Updates conversation metadata

    If conversation_id is None:
        - Creates new conversation with AI-generated title
        - Saves first message

    Returns:
        conversation_id (existing or newly created)
    """
    from common.conversation_utils import (
        generate_conversation_id,
        generate_conversation_title,
        build_conversation_metadata_item,
        build_message_item,
        update_conversation_metadata,
    )

    table = dynamodb.Table(CONVERSATIONS_TABLE)

    # Case 1: No conversation_id - create new conversation
    if not conversation_id:
        logger.info("Creating new conversation for first message")

        conversation_id = generate_conversation_id()

        # Generate title using Bedrock
        try:
            title = generate_conversation_title(user_message, bedrock_client)
        except Exception as e:
            logger.warning(f"Failed to generate AI title: {e}")
            title = generate_conversation_title(user_message, None)

        # Create metadata item
        metadata_item = build_conversation_metadata_item(user_id=user_id, conversation_id=conversation_id, title=title)

        try:
            table.put_item(Item=metadata_item)
            logger.info(f"Created conversation: {conversation_id} with title: {title}")
        except ClientError as e:
            logger.error(f"Failed to create conversation metadata: {e}")
            raise

    # Case 2: conversation_id provided - validate ownership
    else:
        logger.info(f"Adding message to existing conversation: {conversation_id}")

        try:
            metadata_response = table.get_item(Key={"user_id": user_id, "sk": f"CONV#{conversation_id}"})

            if "Item" not in metadata_response:
                raise ValueError(f"Conversation not found: {conversation_id}")

            if metadata_response["Item"].get("deleted", False):
                raise ValueError("Cannot add message to deleted conversation")

        except ClientError as e:
            logger.error(f"Failed to verify conversation: {e}")
            raise

    # Build and save message item
    message_item = build_message_item(
        user_id=user_id,
        conversation_id=conversation_id,
        user_message=user_message,
        ai_response=ai_response,
        chart_url=chart_url,
        ttl_days=30,
    )

    try:
        table.put_item(Item=message_item)
        logger.info(f"Saved message to conversation: {conversation_id}")

        # Update conversation metadata
        update_conversation_metadata(
            table=table,
            user_id=user_id,
            conversation_id=conversation_id,
            increment_message_count=True,
            new_message_preview=user_message,
        )

        return conversation_id

    except ClientError as e:
        logger.error(f"Failed to save message: {e}")
        raise


# Local testing
if __name__ == "__main__":
    print("Chat Handler - Local Test Not Recommended")
    print("=" * 70)
    print("\nThis handler requires:")
    print("  - User profile in DynamoDB")
    print("  - JWT authentication")
    print("  - Multiple AWS services (S3, DynamoDB, Secrets Manager)")
    print("\nRecommendation: Deploy and test via API Gateway")
    print("\nTo test locally, you would need to mock:")
    print("  - JWT event structure")
    print("  - Existing user profile")
    print("  - All AWS service calls")
