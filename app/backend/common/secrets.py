"""
AWS Secrets Manager integration.
Securely retrieves secrets for Lambda functions.
"""

import json
import logging
import os
from typing import Dict, Any, Optional

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Module-level cache for secrets (persists across Lambda invocations in same container)
_secret_cache: Dict[str, Any] = {}


def get_secret(secret_name: str, region: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieve secret from AWS Secrets Manager.

    Implements caching to avoid repeated API calls within the same Lambda container.

    Args:
        secret_name: Name or ARN of the secret
        region: AWS region (defaults to AWS_REGION environment variable)

    Returns:
        Secret value as dict (parsed from JSON)

    Raises:
        ValueError: If secret not found or access denied
        Exception: For other AWS errors

    Example:
        >>> secret = get_secret("/mira/astrology/api_key")
        >>> api_key = secret['api_key']
    """
    # Check cache first
    if secret_name in _secret_cache:
        logger.debug(f"Using cached secret: {secret_name}")
        return _secret_cache[secret_name]

    # Get region from environment or parameter
    secret_region = region or os.getenv("AWS_REGION", "us-east-1")

    logger.info(f"Retrieving secret from Secrets Manager: {secret_name}")

    try:
        # Create Secrets Manager client
        client = boto3.client("secretsmanager", region_name=secret_region)

        # Retrieve secret value
        response = client.get_secret_value(SecretId=secret_name)

        # Parse secret string (assumes JSON format)
        secret_string = response["SecretString"]
        secret_dict = json.loads(secret_string)

        # Cache the result
        _secret_cache[secret_name] = secret_dict

        logger.info(f"Successfully retrieved secret: {secret_name}")
        return secret_dict

    except ClientError as e:
        error_code = e.response["Error"]["Code"]

        if error_code == "ResourceNotFoundException":
            error_msg = f"Secret not found: {secret_name}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        elif error_code == "AccessDeniedException":
            error_msg = f"Permission denied to access secret: {secret_name}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        elif error_code == "InvalidRequestException":
            error_msg = f"Invalid request for secret: {secret_name}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        else:
            logger.error(f"Unexpected error retrieving secret: {e}")
            raise

    except json.JSONDecodeError as e:
        error_msg = f"Secret {secret_name} is not valid JSON"
        logger.error(f"{error_msg}: {e}")
        raise ValueError(error_msg)


def get_astrology_api_key() -> str:
    """
    Retrieve Astrologer API key from Secrets Manager.

    Convenience function for getting the Astrology API key.
    Uses caching to avoid repeated Secrets Manager calls.

    Returns:
        Astrologer API key string

    Raises:
        ValueError: If secret not found or invalid format

    Example:
        >>> api_key = get_astrology_api_key()
        >>> # Use in API calls
    """
    # Secret name from Terraform
    secret_name = "/mira/astrology/api_key"

    # Get secret
    secret = get_secret(secret_name)

    # Extract API key
    if "api_key" not in secret:
        raise ValueError(f"Secret {secret_name} missing 'api_key' field")

    api_key = secret["api_key"]

    # Log safely (don't expose key)
    logger.info(f"Retrieved Astrology API key (length: {len(api_key)} chars)")

    return api_key


def clear_secret_cache():
    """
    Clear the secret cache.

    Useful for testing or if secrets are rotated.
    """
    _secret_cache.clear()
    logger.info("Secret cache cleared")


# Local testing
if __name__ == "__main__":
    print("Testing Secrets Manager Integration\n")
    print("=" * 60)

    # Test 1: Mock test (always works locally)
    print("\n[Test 1] Mock Secrets Manager call")
    print("-" * 60)

    from unittest.mock import patch, Mock

    @patch("boto3.client")
    def test_mock_secret(mock_boto):
        """Test with mocked Secrets Manager"""
        # Setup mock response
        mock_client = Mock()
        mock_client.get_secret_value.return_value = {"SecretString": '{"api_key": "test-key-12345"}'}
        mock_boto.return_value = mock_client

        # Clear cache for clean test
        clear_secret_cache()

        # Test get_secret
        result = get_secret("/test/secret")
        assert result == {"api_key": "test-key-12345"}
        print("get_secret() works correctly")

        # Test get_astrology_api_key
        clear_secret_cache()
        mock_client.get_secret_value.return_value = {"SecretString": '{"api_key": "astrology-key-xyz"}'}

        # Reset call count for clean caching test
        mock_client.get_secret_value.reset_mock()

        api_key = get_astrology_api_key()
        assert api_key == "astrology-key-xyz"
        print("get_astrology_api_key() works correctly")

        # Test caching (call again without clearing cache)
        api_key_2 = get_astrology_api_key()
        assert api_key_2 == "astrology-key-xyz"
        assert api_key_2 == api_key  # Same value
        # Should only call get_secret_value once (second call uses cache)
        assert mock_client.get_secret_value.call_count == 1
        print("Caching works correctly")

        print("Test 1 passed")

    test_mock_secret()

    # Test 2: Error handling
    print("\n[Test 2] Error handling for missing secret")
    print("-" * 60)

    @patch("boto3.client")
    def test_missing_secret(mock_boto):
        """Test error handling for ResourceNotFoundException"""
        mock_client = Mock()
        mock_client.get_secret_value.side_effect = ClientError(
            {
                "Error": {
                    "Code": "ResourceNotFoundException",
                    "Message": "Secret not found",
                }
            },
            "GetSecretValue",
        )
        mock_boto.return_value = mock_client

        clear_secret_cache()

        try:
            get_secret("/nonexistent/secret")
            print("Should have raised ValueError")
            raise AssertionError("Should have raised ValueError")
        except ValueError as e:
            assert "not found" in str(e)
            print(f"Correctly raised error: {e}")
            print("Test 2 passed")

    test_missing_secret()

    # Test 3: Error handling for access denied
    print("\n[Test 3] Error handling for access denied")
    print("-" * 60)

    @patch("boto3.client")
    def test_access_denied(mock_boto):
        """Test error handling for AccessDeniedException"""
        mock_client = Mock()
        mock_client.get_secret_value.side_effect = ClientError(
            {"Error": {"Code": "AccessDeniedException", "Message": "Access denied"}},
            "GetSecretValue",
        )
        mock_boto.return_value = mock_client

        clear_secret_cache()

        try:
            get_secret("/restricted/secret")
            print("Should have raised ValueError")
            raise AssertionError("Should have raised ValueError")
        except ValueError as e:
            assert "Permission denied" in str(e)
            print(f"Correctly raised error: {e}")
            print("Test 3 passed")

    test_access_denied()

    # Test 4: Invalid JSON format
    print("\n[Test 4] Error handling for invalid JSON")
    print("-" * 60)

    @patch("boto3.client")
    def test_invalid_json(mock_boto):
        """Test error handling for invalid JSON in secret"""
        mock_client = Mock()
        mock_client.get_secret_value.return_value = {"SecretString": "not-valid-json{"}
        mock_boto.return_value = mock_client

        clear_secret_cache()

        try:
            get_secret("/invalid/secret")
            print("Should have raised ValueError")
            raise AssertionError("Should have raised ValueError")
        except ValueError as e:
            assert "not valid JSON" in str(e)
            print(f"Correctly raised error: {e}")
            print("Test 4 passed")

    test_invalid_json()

    print("\n" + "=" * 60)
    print("All mock tests passed!")
    print("\nTo test with real AWS Secrets Manager:")
    print("  aws secretsmanager get-secret-value --secret-id '/mira/astrology/api_key' --region us-east-1")
