"""
API Gateway event handler wrapper.
Simplifies Lambda function development by handling event parsing and response formatting.
"""

import json
import logging
from functools import wraps
from typing import Any, Callable, Dict

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def api_handler(func: Callable) -> Callable:
    """
    Decorator for API Gateway Lambda handlers.

    Automatically handles:
    - Parsing API Gateway event (body, headers, query params, path params)
    - Building standard API Gateway response
    - Error handling with proper status codes
    - CORS headers
    - Request/response logging

    Usage:
        @api_handler
        def my_handler(event, context):
            body = event['parsed_body']
            return {'message': 'success', 'data': body}

    Args:
        func: Lambda handler function that returns a dict

    Returns:
        Wrapped function that returns API Gateway response format
    """

    @wraps(func)
    def wrapper(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        request_id = context.aws_request_id if context else "local-test"

        try:
            # Log incoming request
            logger.info(f"Request ID: {request_id}")
            logger.info(f"HTTP Method: {event.get('httpMethod', 'UNKNOWN')}")
            logger.info(f"Path: {event.get('path', 'UNKNOWN')}")

            # Parse event data
            parsed_event = _parse_event(event)

            # Call actual handler
            result = func(parsed_event, context)

            # Build success response
            response = _build_response(200, result)

            logger.info(f"Request {request_id} completed successfully")
            return response

        except ValueError as e:
            # Client error (bad request)
            logger.warning(f"Request {request_id} failed - Bad request: {str(e)}")
            return _build_response(400, {"error": "Bad request", "message": str(e)})

        except Exception as e:
            # Server error
            logger.error(f"Request {request_id} failed - Internal error: {str(e)}", exc_info=True)
            return _build_response(500, {"error": "Internal server error", "message": str(e)})

    return wrapper


def _parse_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse API Gateway event into a clean dictionary.

    Args:
        event: Raw API Gateway event

    Returns:
        Dict with parsed body, headers, query params, and path params
    """
    # Parse JSON body
    body_str = event.get("body", "{}")
    try:
        parsed_body = json.loads(body_str) if body_str else {}
    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON in request body: {body_str}")

    return {
        "parsed_body": parsed_body,
        "headers": event.get("headers", {}),
        "query_params": event.get("queryStringParameters", {}),
        "path_params": event.get("pathParameters", {}),
        "http_method": event.get("httpMethod", ""),
        "path": event.get("path", ""),
        "raw_event": event,
    }


def _build_response(status_code: int, body: Any) -> Dict[str, Any]:
    """
    Build API Gateway response with standard format.

    Args:
        status_code: HTTP status code
        body: Response body (will be JSON encoded)

    Returns:
        API Gateway response dictionary
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        "body": json.dumps(body),
    }


# Local testing
if __name__ == "__main__":
    print("Testing API Gateway Event Handler Wrapper\n")
    print("=" * 60)

    # Mock context for testing
    class MockContext:
        aws_request_id = "test-request-123"

    # Test 1: Successful request
    print("\n[Test 1] Successful POST request with body")
    print("-" * 60)

    @api_handler
    def test_success_handler(event, context):
        """Test handler that returns parsed body"""
        body = event["parsed_body"]
        return {"message": "Success", "received": body, "method": event["http_method"]}

    test_event_1 = {
        "httpMethod": "POST",
        "path": "/test",
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"name": "John", "age": 25}),
        "queryStringParameters": None,
        "pathParameters": None,
    }

    result_1 = test_success_handler(test_event_1, MockContext())
    print(f"Status Code: {result_1['statusCode']}")
    print(f"Response Body: {result_1['body']}")
    assert result_1["statusCode"] == 200
    print("Test 1 passed")

    # Test 2: Request with query parameters
    print("\n[Test 2] GET request with query parameters")
    print("-" * 60)

    @api_handler
    def test_query_handler(event, context):
        """Test handler that uses query params"""
        query = event["query_params"]
        return {"message": "Query params received", "params": query}

    test_event_2 = {
        "httpMethod": "GET",
        "path": "/test",
        "headers": {},
        "body": None,
        "queryStringParameters": {"userId": "123", "page": "1"},
        "pathParameters": None,
    }

    result_2 = test_query_handler(test_event_2, MockContext())
    print(f"Status Code: {result_2['statusCode']}")
    print(f"Response Body: {result_2['body']}")
    assert result_2["statusCode"] == 200
    print("Test 2 passed")

    # Test 3: Invalid JSON body (should return 400)
    print("\n[Test 3] Invalid JSON in request body")
    print("-" * 60)

    @api_handler
    def test_invalid_json_handler(event, context):
        """Test handler - should not be called"""
        return {"message": "This should not execute"}

    test_event_3 = {
        "httpMethod": "POST",
        "path": "/test",
        "headers": {},
        "body": "{invalid json}",  # Invalid JSON
        "queryStringParameters": None,
        "pathParameters": None,
    }

    result_3 = test_invalid_json_handler(test_event_3, MockContext())
    print(f"Status Code: {result_3['statusCode']}")
    print(f"Response Body: {result_3['body']}")
    assert result_3["statusCode"] == 400
    print("Test 3 passed (correctly returned 400)")

    # Test 4: Handler raises exception (should return 500)
    print("\n[Test 4] Handler throws exception")
    print("-" * 60)

    @api_handler
    def test_error_handler(event, context):
        """Test handler that raises exception"""
        raise RuntimeError("Something went wrong!")

    test_event_4 = {
        "httpMethod": "POST",
        "path": "/test",
        "headers": {},
        "body": "{}",
        "queryStringParameters": None,
        "pathParameters": None,
    }

    result_4 = test_error_handler(test_event_4, MockContext())
    print(f"Status Code: {result_4['statusCode']}")
    print(f"Response Body: {result_4['body']}")
    assert result_4["statusCode"] == 500
    print("Test 4 passed (correctly returned 500)")

    # Test 5: Path parameters
    print("\n[Test 5] Request with path parameters")
    print("-" * 60)

    @api_handler
    def test_path_handler(event, context):
        """Test handler that uses path params"""
        path_params = event["path_params"]
        return {
            "message": "Path params received",
            "userId": path_params.get("userId"),
            "itemId": path_params.get("itemId"),
        }

    test_event_5 = {
        "httpMethod": "GET",
        "path": "/users/123/items/456",
        "headers": {},
        "body": None,
        "queryStringParameters": None,
        "pathParameters": {"userId": "123", "itemId": "456"},
    }

    result_5 = test_path_handler(test_event_5, MockContext())
    print(f"Status Code: {result_5['statusCode']}")
    print(f"Response Body: {result_5['body']}")
    assert result_5["statusCode"] == 200
    print("Test 5 passed")

    print("\n" + "=" * 60)
    print("All tests passed!")
    print("\nWrapper is ready to use in your Lambda handlers.")
