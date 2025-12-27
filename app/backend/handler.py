"""
Main Lambda handler entry point for API Gateway.
Routes requests to appropriate endpoint handlers.
"""

import json
import logging
import re

from api.health_handler import lambda_handler as health_handler
from api.profile_handler import lambda_handler as profile_handler
from api.chat_handler import lambda_handler as chat_handler
from api.conversation_handler import (
    create_conversation,
    list_conversations,
    get_conversation_messages,
    delete_conversation,
    update_conversation,
)

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """
    Main entry point - routes to specific handlers based on path.

    Supported routes:
    - GET    /health                              -> Health check
    - POST   /profile                             -> Create user profile
    - GET    /profile                             -> Get user profile
    - POST   /chat                                -> Send chat message
    - POST   /conversations                       -> Create conversation thread
    - GET    /conversations                       -> List all conversations
    - GET    /conversations/{id}/messages         -> Get conversation messages
    - DELETE /conversations/{id}                  -> Delete conversation
    - PATCH  /conversations/{id}                  -> Update conversation title
    """
    # Handle warmup events from EventBridge keep-warm rule
    if event.get("source") == "mira.keep-warm":
        logger.info("Warmup event - establishing Bedrock connection")

        try:
            # Import here to avoid circular dependency
            from common.bedrock_client import BedrockClient

            # Initialize Bedrock client (establishes VPC endpoint connection)
            client = BedrockClient()

            # Make minimal Bedrock call to keep connection alive
            client.generate_response(
                user_profile={
                    "zodiac_sign": "Aries",
                    "birth_date": "2000-01-01",
                    "birth_location": "Test",
                },
                chart_data={"data": {}, "aspects": []},
                user_question="warmup",
                max_tokens=10,
            )

            logger.info("Bedrock connection warmed successfully")
            return {
                "statusCode": 200,
                "body": json.dumps({"status": "warmed", "bedrock": "connected"}),
            }

        except Exception as e:
            logger.warning(f"Warmup Bedrock test failed: {e}")
            # Still return success - warmup event should not fail
            return {
                "statusCode": 200,
                "body": json.dumps({"status": "warmed", "bedrock": "failed"}),
            }

    # Get path and HTTP method from event (HTTP API v2.0 format)
    raw_path = event.get("rawPath", "")
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "GET")

    # Log request for debugging
    logger.info(f"Routing request: {http_method} {raw_path}")

    # Route to appropriate handler
    if raw_path == "/health" or raw_path == "/default/health":
        return health_handler(event, context)

    elif raw_path == "/profile" or raw_path == "/default/profile":
        # Profile endpoint accepts both GET and POST
        if http_method == "POST":
            return profile_handler(event, context)
        elif http_method == "GET":
            return profile_handler(event, context)
        else:
            return {
                "statusCode": 405,
                "headers": {"Content-Type": "application/json", "Allow": "GET, POST"},
                "body": '{"error": "Method not allowed", "message": "Only GET and POST are supported for /profile"}',
            }

    elif raw_path == "/chat" or raw_path == "/default/chat":
        # Chat endpoint only accepts POST
        if http_method == "POST":
            return chat_handler(event, context)
        else:
            return {
                "statusCode": 405,
                "headers": {"Content-Type": "application/json", "Allow": "POST"},
                "body": '{"error": "Method not allowed", "message": "Only POST is supported for /chat"}',
            }

    # Conversation management routes
    elif raw_path == "/conversations" or raw_path == "/default/conversations":
        if http_method == "POST":
            # Create new conversation
            return create_conversation(event, context)
        elif http_method == "GET":
            # List all conversations
            return list_conversations(event, context)
        else:
            return {
                "statusCode": 405,
                "headers": {"Content-Type": "application/json", "Allow": "GET, POST"},
                "body": '{"error": "Method not allowed"}',
            }

    # Conversation detail routes with path parameters
    # Pattern: /conversations/{conversation_id} or /conversations/{conversation_id}/messages
    elif raw_path.startswith("/conversations/") or raw_path.startswith("/default/conversations/"):
        # Extract conversation_id from path
        # Pattern: /conversations/{id} or /conversations/{id}/messages or /default/conversations/{id}

        # Remove /default prefix if present
        path = raw_path.replace("/default", "")

        # Extract conversation ID using regex
        match = re.match(r"/conversations/([^/]+)(?:/messages)?$", path)

        if not match:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Invalid conversation path"}),
            }

        conversation_id = match.group(1)

        # Add conversation_id to path_params for handler to use
        if "pathParameters" not in event:
            event["pathParameters"] = {}
        event["pathParameters"]["conversation_id"] = conversation_id

        # Route based on sub-path and method
        if path.endswith("/messages"):
            # GET /conversations/{id}/messages
            if http_method == "GET":
                return get_conversation_messages(event, context)
            else:
                return {
                    "statusCode": 405,
                    "headers": {"Content-Type": "application/json", "Allow": "GET"},
                    "body": '{"error": "Method not allowed"}',
                }
        else:
            # /conversations/{id}
            if http_method == "DELETE":
                return delete_conversation(event, context)
            elif http_method == "PATCH":
                return update_conversation(event, context)
            elif http_method == "GET":
                # Optional: Get single conversation metadata
                # For now, return 404 (use list endpoint instead)
                return {
                    "statusCode": 404,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Use GET /conversations/{id}/messages to get conversation data"}),
                }
            else:
                return {
                    "statusCode": 405,
                    "headers": {
                        "Content-Type": "application/json",
                        "Allow": "DELETE, PATCH",
                    },
                    "body": '{"error": "Method not allowed"}',
                }

    # Default 404 response
    return {
        "statusCode": 404,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": "Not found", "path": raw_path, "method": http_method}),
    }
