"""
Health check endpoint for Mira API.
Returns service status for monitoring and deployment verification.
"""

import sys
import os

# Add parent directory to Python path for local testing
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json  # noqa: E402
import logging  # noqa: E402
from datetime import datetime  # noqa: E402

from common import api_handler  # noqa: E402

logger = logging.getLogger()
logger.setLevel(logging.INFO)


@api_handler
def lambda_handler(event, context):
    """
    Health check endpoint.

    Returns service status information including:
    - Service health status
    - Service name and version
    - Current timestamp

    This endpoint is used for:
    - Deployment verification
    - Uptime monitoring
    - Load balancer health checks

    Args:
        event: Parsed API Gateway event (from wrapper)
        context: Lambda context

    Returns:
        Dict with health status information
    """
    logger.info("Health check requested")

    return {
        "status": "healthy",
        "service": "Mira API",
        "version": "1.0.0",
        "timestamp": int(datetime.now().timestamp()),
    }


# Local testing
if __name__ == "__main__":
    print("Testing Health Endpoint Lambda\n")
    print("=" * 60)

    class MockContext:
        aws_request_id = "test-health-check"

    # Test: GET /health
    print("\n[Test] GET /health")
    print("-" * 60)

    test_event = {
        "httpMethod": "GET",
        "path": "/health",
        "headers": {},
        "body": None,
        "queryStringParameters": None,
        "pathParameters": None,
    }

    result = lambda_handler(test_event, MockContext())

    print(f"Status Code: {result['statusCode']}")
    print(f"Headers: {json.dumps(result['headers'], indent=2)}")
    print(f"Body: {result['body']}")

    # Verify response
    assert result["statusCode"] == 200, "Status code should be 200"

    body = json.loads(result["body"])
    assert body["status"] == "healthy", "Status should be 'healthy'"
    assert body["service"] == "Mira API", "Service name should be 'Mira API'"
    assert "timestamp" in body, "Should include timestamp"

    print("\nAll assertions passed!")
    print("\nExpected response format:")
    print(json.dumps(body, indent=2))
    print("\n" + "=" * 60)
    print("Health endpoint is ready to deploy!")
