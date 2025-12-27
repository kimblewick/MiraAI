"""
Conversation thread management handler.

Provides endpoints for:
- POST /conversations - Create new conversation thread
- GET /conversations - List all user's conversations
- GET /conversations/{id}/messages - Get messages in a conversation
- DELETE /conversations/{id} - Soft delete a conversation
- PATCH /conversations/{id} - Update conversation title
"""

import os
import json
import logging
from typing import Dict, Any
from datetime import datetime

import boto3
from botocore.exceptions import ClientError

from common.api_wrapper import api_handler
from common.conversation_utils import (
    generate_conversation_id,
    build_conversation_metadata_item,
    format_conversation_for_response,
    format_message_for_response,
)

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB setup
dynamodb = boto3.resource("dynamodb")
CONVERSATIONS_TABLE = os.environ.get("DYNAMODB_CONVERSATIONS_TABLE", "mira-conversations-dev")

# Pagination limits
DEFAULT_CONVERSATION_LIMIT = 20
MAX_CONVERSATION_LIMIT = 100
DEFAULT_MESSAGE_LIMIT = 50
MAX_MESSAGE_LIMIT = 200


def extract_user_id_from_event(event: Dict[str, Any]) -> str:
    """Extract user_id from JWT claims."""
    try:
        # Check if event was wrapped by api_handler
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
def create_conversation(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Create a new conversation thread.

    POST /conversations
    Body: {
        "title": "Optional custom title"
    }

    Returns:
        {
            "conversation_id": "uuid",
            "title": "New Conversation",
            "created_at": "ISO timestamp",
            "message_count": 0
        }
    """
    # Extract user ID from JWT
    user_id = extract_user_id_from_event(event)

    # Parse request body
    body = event.get("body_json", {})
    if not body:
        body = event.get("parsed_body", {})

    custom_title = body.get("title", "").strip()

    # Generate conversation ID
    conversation_id = generate_conversation_id()

    # Use custom title or default
    title = custom_title if custom_title else "New Conversation"

    # Build metadata item
    metadata_item = build_conversation_metadata_item(user_id=user_id, conversation_id=conversation_id, title=title)

    # Save to DynamoDB
    table = dynamodb.Table(CONVERSATIONS_TABLE)

    try:
        table.put_item(Item=metadata_item)
        logger.info(f"Created conversation: {conversation_id} for user: {user_id}")

        # Return formatted response
        return {
            "conversation_id": conversation_id,
            "title": title,
            "created_at": metadata_item["created_at"],
            "updated_at": metadata_item["updated_at"],
            "message_count": 0,
        }

    except ClientError as e:
        logger.error(f"Failed to create conversation: {e}")
        raise Exception(f"Database error: {str(e)}")


@api_handler
def list_conversations(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    List all conversations for authenticated user.

    GET /conversations?limit=20

    Query parameters:
    - limit: Number of conversations to return (default 20, max 100)
    - next_token: Pagination token from previous response

    Returns:
        {
            "conversations": [
                {
                    "conversation_id": "uuid",
                    "title": "...",
                    "message_count": 5,
                    "created_at": "...",
                    "updated_at": "...",
                    "last_message_preview": "..."
                }
            ],
            "next_token": "base64_token",
            "has_more": false
        }
    """
    # Extract user ID from JWT
    user_id = extract_user_id_from_event(event)

    # Parse query parameters
    query_params = event.get("query_params", {})
    limit = int(query_params.get("limit", DEFAULT_CONVERSATION_LIMIT))
    limit = min(limit, MAX_CONVERSATION_LIMIT)  # Cap at maximum

    next_token = query_params.get("next_token")

    # Query DynamoDB for all conversation metadata items
    table = dynamodb.Table(CONVERSATIONS_TABLE)

    try:
        # Build query parameters
        query_kwargs = {
            "KeyConditionExpression": "user_id = :uid AND begins_with(sk, :prefix)",
            "ExpressionAttributeValues": {
                ":uid": user_id,
                ":prefix": "CONV#",
                ":metadata": "METADATA",
                ":deleted_false": False,
            },
            "FilterExpression": "item_type = :metadata AND (attribute_not_exists(deleted) OR deleted = :deleted_false)",
            # Note: No Limit here, we need to fetch all conversations to sort by updated_at
            "ScanIndexForward": True,  # Fetch all items (sk order doesn't matter, we'll sort in Python)
        }

        # Add pagination token if provided
        if next_token:
            try:
                import base64

                decoded_token = json.loads(base64.b64decode(next_token).decode("utf-8"))
                query_kwargs["ExclusiveStartKey"] = decoded_token
            except Exception as e:
                logger.warning(f"Invalid next_token: {e}")
                # Continue without pagination token

        # Execute query
        response = table.query(**query_kwargs)

        # Format conversations for response
        conversations = [format_conversation_for_response(item) for item in response.get("Items", [])]

        # Sort by updated_at (most recent first)
        conversations.sort(key=lambda x: x.get("updated_at", ""), reverse=True)

        # Apply limit after sorting
        conversations = conversations[:limit]

        # Build response
        result = {
            "conversations": conversations,
            "has_more": "LastEvaluatedKey" in response,
        }

        # Add next_token if more results available
        if "LastEvaluatedKey" in response:
            import base64

            token = base64.b64encode(json.dumps(response["LastEvaluatedKey"]).encode("utf-8")).decode("utf-8")
            result["next_token"] = token

        logger.info(f"Listed {len(conversations)} conversations for user: {user_id}")
        return result

    except ClientError as e:
        logger.error(f"Failed to list conversations: {e}")
        raise Exception(f"Database error: {str(e)}")


@api_handler
def get_conversation_messages(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Get all messages in a specific conversation.

    GET /conversations/{conversation_id}/messages?limit=50

    Path parameters:
    - conversation_id: ID of the conversation

    Query parameters:
    - limit: Number of messages to return (default 50, max 200)
    - next_token: Pagination token

    Returns:
        {
            "conversation_id": "uuid",
            "messages": [
                {
                    "timestamp": 1732622400,
                    "created_at": "...",
                    "user_message": "...",
                    "ai_response": "...",
                    "chart_url": "..."
                }
            ],
            "next_token": "...",
            "has_more": false
        }
    """
    # Extract user ID from JWT
    user_id = extract_user_id_from_event(event)

    # Extract conversation_id from path
    path_params = event.get("path_params", {})
    conversation_id = path_params.get("conversation_id")

    if not conversation_id:
        raise ValueError("conversation_id is required in path")

    # Parse query parameters
    query_params = event.get("query_params", {})
    limit = int(query_params.get("limit", DEFAULT_MESSAGE_LIMIT))
    limit = min(limit, MAX_MESSAGE_LIMIT)

    next_token = query_params.get("next_token")

    # First, verify user owns this conversation
    table = dynamodb.Table(CONVERSATIONS_TABLE)

    try:
        # Get conversation metadata to verify ownership
        metadata_response = table.get_item(Key={"user_id": user_id, "sk": f"CONV#{conversation_id}"})

        if "Item" not in metadata_response:
            raise ValueError(f"Conversation not found: {conversation_id}")

        # Check if conversation is deleted
        if metadata_response["Item"].get("deleted", False):
            raise ValueError(f"Conversation has been deleted: {conversation_id}")

        # Query messages
        query_kwargs = {
            "KeyConditionExpression": "user_id = :uid AND begins_with(sk, :prefix)",
            "ExpressionAttributeValues": {
                ":uid": user_id,
                ":prefix": f"CONV#{conversation_id}#MSG#",
            },
            "Limit": limit,
            "ScanIndexForward": True,  # Chronological order (oldest first)
        }

        # Add pagination token
        if next_token:
            try:
                import base64

                decoded_token = json.loads(base64.b64decode(next_token).decode("utf-8"))
                query_kwargs["ExclusiveStartKey"] = decoded_token
            except Exception as e:
                logger.warning(f"Invalid next_token: {e}")

        # Execute query
        response = table.query(**query_kwargs)

        # Format messages
        messages = [format_message_for_response(item) for item in response.get("Items", [])]

        # Build response
        result = {
            "conversation_id": conversation_id,
            "messages": messages,
            "has_more": "LastEvaluatedKey" in response,
        }

        # Add next_token
        if "LastEvaluatedKey" in response:
            import base64

            token = base64.b64encode(json.dumps(response["LastEvaluatedKey"]).encode("utf-8")).decode("utf-8")
            result["next_token"] = token

        logger.info(f"Retrieved {len(messages)} messages for conversation: {conversation_id}")
        return result

    except ValueError as e:
        # Return 404 for not found or deleted conversations
        logger.warning(f"Conversation access error: {e}")
        return {"statusCode": 404, "body": json.dumps({"error": str(e)})}

    except ClientError as e:
        logger.error(f"Failed to get messages: {e}")
        raise Exception(f"Database error: {str(e)}")


@api_handler
def delete_conversation(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Soft delete a conversation.

    DELETE /conversations/{conversation_id}

    Marks conversation as deleted without actually removing data.
    Deleted conversations are filtered out from list queries.

    Returns:
        {
            "message": "Conversation deleted successfully",
            "conversation_id": "uuid"
        }
    """
    # Extract user ID from JWT
    user_id = extract_user_id_from_event(event)

    # Extract conversation_id from path
    path_params = event.get("path_params", {})
    conversation_id = path_params.get("conversation_id")

    if not conversation_id:
        raise ValueError("conversation_id is required in path")

    table = dynamodb.Table(CONVERSATIONS_TABLE)

    try:
        # Soft delete: set deleted flag
        now = datetime.utcnow().isoformat() + "Z"

        table.update_item(
            Key={"user_id": user_id, "sk": f"CONV#{conversation_id}"},
            UpdateExpression="SET deleted = :true, deleted_at = :now, updated_at = :now",
            ExpressionAttributeValues={
                ":true": True,
                ":now": now,
            },
            ConditionExpression="attribute_exists(user_id)",  # Ensure conversation exists
        )

        logger.info(f"Soft deleted conversation: {conversation_id}")

        return {
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id,
        }

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.warning(f"Conversation not found: {conversation_id}")
            return {
                "statusCode": 404,
                "body": json.dumps({"error": f"Conversation not found: {conversation_id}"}),
            }

        logger.error(f"Failed to delete conversation: {e}")
        raise Exception(f"Database error: {str(e)}")


@api_handler
def update_conversation(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Update conversation metadata (currently only title).

    PATCH /conversations/{conversation_id}
    Body: {
        "title": "New title"
    }

    Returns:
        {
            "conversation_id": "uuid",
            "title": "Updated title",
            "updated_at": "ISO timestamp"
        }
    """
    # Extract user ID from JWT
    user_id = extract_user_id_from_event(event)

    # Extract conversation_id from path
    path_params = event.get("path_params", {})
    conversation_id = path_params.get("conversation_id")

    if not conversation_id:
        raise ValueError("conversation_id is required in path")

    # Parse request body
    body = event.get("body_json", {})
    if not body:
        body = event.get("parsed_body", {})

    new_title = body.get("title", "").strip()

    if not new_title:
        raise ValueError("title is required in request body")

    if len(new_title) > 100:
        raise ValueError("title must be 100 characters or less")

    table = dynamodb.Table(CONVERSATIONS_TABLE)

    try:
        # Update title
        now = datetime.utcnow().isoformat() + "Z"

        response = table.update_item(
            Key={"user_id": user_id, "sk": f"CONV#{conversation_id}"},
            UpdateExpression="SET title = :title, updated_at = :now",
            ExpressionAttributeValues={
                ":title": new_title,
                ":now": now,
                ":false": False,
            },
            ConditionExpression="attribute_exists(user_id) AND (attribute_not_exists(deleted) OR deleted = :false)",
            ReturnValues="ALL_NEW",
        )

        updated_item = response.get("Attributes", {})

        logger.info(f"Updated conversation title: {conversation_id}")

        return {
            "conversation_id": conversation_id,
            "title": updated_item.get("title", new_title),
            "updated_at": updated_item.get("updated_at", now),
        }

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.warning(f"Conversation not found or deleted: {conversation_id}")
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "Conversation not found or has been deleted"}),
            }

        logger.error(f"Failed to update conversation: {e}")
        raise Exception(f"Database error: {str(e)}")
