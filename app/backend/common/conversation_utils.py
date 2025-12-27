"""
Utility functions for conversation thread management.

Provides helpers for:
- Building DynamoDB items (metadata and messages)
- Generating conversation titles using AI
- Formatting conversation data for API responses
"""

import time
import uuid
import logging
import re
from datetime import datetime
from typing import Dict, Any, Optional
from decimal import Decimal

logger = logging.getLogger(__name__)


def generate_conversation_id() -> str:
    """
    Generate a unique conversation ID using UUID4.

    Returns:
        str: UUID4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
    """
    return str(uuid.uuid4())


def generate_conversation_title(first_message: str, bedrock_client=None) -> str:
    """
    Generate a concise title for a conversation based on first message.

    Strategy:
    1. Try to use Bedrock to generate a 3-5 word summary
    2. If Bedrock fails, truncate first message to 50 chars
    3. Default to "New Conversation" if message is empty

    Args:
        first_message: User's first message in the conversation
        bedrock_client: Optional BedrockClient instance for AI title generation

    Returns:
        str: Generated title (max 100 chars)
    """
    if not first_message or not first_message.strip():
        return "New Conversation"

    # Try AI-generated title
    if bedrock_client:
        try:
            title_prompt = f"""Generate ONLY a concise 3-5 word title. Do not explain or add reasoning.

            Question: {first_message}

            Output ONLY the title (3-5 words, no quotes, same language as question):"""

            ai_result = bedrock_client.generate_response(
                user_profile={},
                chart_data={},
                user_question=title_prompt,
                max_tokens=500,
            )

            # Extract response string from dict
            if isinstance(ai_result, dict):
                ai_title = ai_result.get("response", "")
            else:
                ai_title = str(ai_result)

            logger.info(f"Raw AI title response: {ai_title[:200]}")

            # Clean up reasoning tags (Bedrock sometimes includes these)
            # Strategy: Remove <reasoning>...</reasoning> blocks, but keep text after
            ai_title = re.sub(r"<reasoning>.*?</reasoning>\s*", "", ai_title, flags=re.DOTALL)
            # Remove any orphaned opening tag
            ai_title = re.sub(r"^.*?<reasoning>\s*", "", ai_title)
            # Remove any orphaned closing tag and everything before it
            ai_title = re.sub(r"^.*?</reasoning>\s*", "", ai_title)

            logger.info(f"Cleaned AI title: {ai_title[:100]}")
            title = ai_title.strip().strip("\"'")

            if title and len(title) <= 100:
                logger.info(f"AI-generated title: {title}")
                return title
            else:
                logger.warning("AI title empty or too long after cleaning, using fallback")

        except Exception as e:
            logger.warning(f"Failed to generate AI title: {e}")

    # Fallback: truncate first message
    truncated = first_message[:50].strip()
    if len(first_message) > 50:
        truncated += "..."

    return truncated


def build_conversation_metadata_item(
    user_id: str,
    conversation_id: str,
    title: str,
    created_at: Optional[str] = None,
    updated_at: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build a conversation metadata item for DynamoDB.

    Item type: METADATA
    Sort key pattern: "CONV#{conversation_id}"

    Args:
        user_id: User's ID
        conversation_id: Unique conversation ID
        title: Conversation title
        created_at: ISO timestamp (defaults to now)
        updated_at: ISO timestamp (defaults to now)

    Returns:
        dict: DynamoDB item ready to put
    """
    now = datetime.utcnow().isoformat() + "Z"

    return {
        "user_id": user_id,
        "sk": f"CONV#{conversation_id}",
        "item_type": "METADATA",
        "conversation_id": conversation_id,
        "title": title,
        "message_count": 0,
        "created_at": created_at or now,
        "updated_at": updated_at or now,
        "last_message_preview": "",
    }


def build_message_item(
    user_id: str,
    conversation_id: str,
    user_message: str,
    ai_response: str,
    chart_url: Optional[str] = None,
    ttl_days: int = 30,
) -> Dict[str, Any]:
    """
    Build a message item for DynamoDB.

    Item type: MESSAGE
    Sort key pattern: "CONV#{conversation_id}#MSG#{timestamp}"

    Args:
        user_id: User's ID
        conversation_id: Conversation ID this message belongs to
        user_message: User's message text
        ai_response: AI's response text
        chart_url: Optional URL to astrology chart
        ttl_days: Days until message expires (default 30)

    Returns:
        dict: DynamoDB item ready to put
    """
    timestamp = int(time.time())
    created_at = datetime.utcnow().isoformat() + "Z"

    # Calculate TTL (30 days from now)
    ttl_timestamp = int(time.time()) + (ttl_days * 24 * 60 * 60)

    item = {
        "user_id": user_id,
        "sk": f"CONV#{conversation_id}#MSG#{timestamp}",
        "item_type": "MESSAGE",
        "conversation_id": conversation_id,
        "timestamp_epoch": timestamp,
        "created_at": created_at,
        "user_message": user_message,
        "ai_response": ai_response,
        "ttl_epoch": ttl_timestamp,
    }

    # Add chart URL if provided
    if chart_url:
        item["chart_url"] = chart_url

    return item


def format_conversation_for_response(metadata_item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format conversation metadata item for API response.

    Removes internal fields and formats timestamps.

    Args:
        metadata_item: DynamoDB metadata item

    Returns:
        dict: Formatted conversation object for API response
    """

    def decimal_to_int(value):
        if isinstance(value, Decimal):
            return int(value)
        return value if value is not None else 0

    return {
        "conversation_id": metadata_item.get("conversation_id", ""),
        "title": metadata_item.get("title", "Untitled"),
        "message_count": decimal_to_int(metadata_item.get("message_count", 0)),
        "created_at": metadata_item.get("created_at", ""),
        "updated_at": metadata_item.get("updated_at", ""),
        "last_message_preview": metadata_item.get("last_message_preview", ""),
    }


def format_message_for_response(message_item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format message item for API response.

    Args:
        message_item: DynamoDB message item

    Returns:
        dict: Formatted message object for API response
    """

    def decimal_to_int(value):
        if isinstance(value, Decimal):
            return int(value)
        return value if value is not None else 0

    formatted = {
        "timestamp": decimal_to_int(message_item.get("timestamp_epoch", 0)),  # ← 改这里
        "created_at": message_item.get("created_at", ""),
        "user_message": message_item.get("user_message", ""),
        "ai_response": message_item.get("ai_response", ""),
    }

    if "chart_url" in message_item:
        formatted["chart_url"] = message_item["chart_url"]

    return formatted


def update_conversation_metadata(
    table,
    user_id: str,
    conversation_id: str,
    increment_message_count: bool = False,
    new_message_preview: Optional[str] = None,
) -> None:
    """
    Update conversation metadata atomically.

    Updates:
    - updated_at timestamp
    - message_count (if increment_message_count=True)
    - last_message_preview (if provided)

    Args:
        table: DynamoDB table resource
        user_id: User's ID
        conversation_id: Conversation ID
        increment_message_count: Whether to increment message count
        new_message_preview: New preview text (first 100 chars of message)
    """
    now = datetime.utcnow().isoformat() + "Z"

    # Build update expression
    update_parts = ["updated_at = :updated_at"]
    expression_values = {":updated_at": now}

    if increment_message_count:
        update_parts.append("message_count = message_count + :inc")
        expression_values[":inc"] = 1

    if new_message_preview:
        # Truncate to 100 chars
        preview = new_message_preview[:100]
        update_parts.append("last_message_preview = :preview")
        expression_values[":preview"] = preview

    update_expression = "SET " + ", ".join(update_parts)

    try:
        table.update_item(
            Key={"user_id": user_id, "sk": f"CONV#{conversation_id}"},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ConditionExpression="attribute_exists(user_id)",  # Ensure conversation exists
        )
        logger.info(f"Updated conversation metadata: {conversation_id}")

    except Exception as e:
        logger.error(f"Failed to update conversation metadata: {e}")
        raise
