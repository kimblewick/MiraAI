"""
JWT token validation and claims extraction.
Extracts user information from Cognito JWT tokens in API Gateway events.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def extract_user_from_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract user information from API Gateway event.

    For HTTP API v2.0 with JWT authorizer, claims are in:
    event['requestContext']['authorizer']['jwt']['claims']

    Args:
        event: API Gateway event (HTTP API v2.0 format)

    Returns:
        Dict with user information:
        {
            'user_id': 'abc-123-def-456',
            'email': 'user@example.com',
            'email_verified': True,
            'token_issued_at': 1700000000,
            'token_expires_at': 1700003600
        }

    Raises:
        ValueError: If authentication information is missing

    Example:
        >>> user_info = extract_user_from_event(event)
        >>> user_id = user_info['user_id']
    """
    try:
        # Navigate to JWT claims in HTTP API v2.0 event structure
        request_context = event.get("requestContext", {})
        authorizer = request_context.get("authorizer", {})
        jwt_data = authorizer.get("jwt", {})
        claims = jwt_data.get("claims", {})

        # Check if claims exist
        if not claims:
            logger.warning("No JWT claims found in event")
            raise ValueError("Authentication required - no JWT claims found")

        # Extract required fields
        user_id = claims.get("sub")
        if not user_id:
            logger.error("JWT claims missing 'sub' field")
            raise ValueError("Invalid JWT token - missing user ID")

        # Extract optional fields
        email = claims.get("email", "")
        email_verified = claims.get("email_verified", "false").lower() == "true"

        # Extract timestamps (as integers)
        iat = int(claims.get("iat", 0)) if claims.get("iat") else None
        exp = int(claims.get("exp", 0)) if claims.get("exp") else None

        user_info = {
            "user_id": user_id,
            "email": email,
            "email_verified": email_verified,
            "token_issued_at": iat,
            "token_expires_at": exp,
        }

        logger.info(f"Extracted user info for user_id: {user_id}")
        return user_info

    except KeyError as e:
        logger.error(f"Error extracting user from event: {e}")
        raise ValueError(f"Invalid event structure: missing {e}")


def get_user_id(event: Dict[str, Any]) -> str:
    """
    Convenience function to get only the user ID.

    Args:
        event: API Gateway event

    Returns:
        Cognito user ID (sub claim)

    Raises:
        ValueError: If user ID not found

    Example:
        >>> user_id = get_user_id(event)
        >>> table.put_item(Item={'userId': user_id, ...})
    """
    user_info = extract_user_from_event(event)
    return user_info["user_id"]


def get_user_email(event: Dict[str, Any]) -> str:
    """
    Convenience function to get user email.

    Args:
        event: API Gateway event

    Returns:
        User email address

    Example:
        >>> email = get_user_email(event)
    """
    user_info = extract_user_from_event(event)
    return user_info["email"]


def require_auth(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Require authentication and return user info.

    Alias for extract_user_from_event with clearer intent.
    Use at the start of protected endpoints.

    Args:
        event: API Gateway event

    Returns:
        User information dict

    Raises:
        ValueError: If not authenticated (will become 400 via api_handler)

    Example:
        >>> user = require_auth(event)
        >>> user_id = user['user_id']
    """
    return extract_user_from_event(event)


# Local testing
if __name__ == "__main__":
    print("Testing JWT Utilities\n")
    print("=" * 60)

    # Test 1: Valid JWT claims in event
    print("\n[Test 1] Extract user from valid event")
    print("-" * 60)

    valid_event = {
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "abc-123-def-456",
                        "email": "john@example.com",
                        "email_verified": "true",
                        "iat": "1700000000",
                        "exp": "1700003600",
                    }
                }
            }
        }
    }

    user_info = extract_user_from_event(valid_event)
    assert user_info["user_id"] == "abc-123-def-456"
    assert user_info["email"] == "john@example.com"
    assert user_info["email_verified"] is True
    assert user_info["token_issued_at"] == 1700000000
    print(f"Extracted user info: {user_info}")
    print("Test 1 passed")

    # Test 2: Get user ID convenience function
    print("\n[Test 2] Get user ID only")
    print("-" * 60)

    user_id = get_user_id(valid_event)
    assert user_id == "abc-123-def-456"
    print(f"User ID: {user_id}")
    print("Test 2 passed")

    # Test 3: Get user email
    print("\n[Test 3] Get user email")
    print("-" * 60)

    email = get_user_email(valid_event)
    assert email == "john@example.com"
    print(f"User email: {email}")
    print("Test 3 passed")

    # Test 4: Missing JWT claims (should raise error)
    print("\n[Test 4] Missing JWT claims")
    print("-" * 60)

    invalid_event = {"requestContext": {}}

    try:
        extract_user_from_event(invalid_event)
        print("Should have raised ValueError")
        raise AssertionError("Should have raised ValueError")
    except ValueError as e:
        assert "Authentication required" in str(e)
        print(f"Correctly raised error: {e}")
        print("Test 4 passed")

    # Test 5: Missing sub claim
    print("\n[Test 5] Missing sub claim in JWT")
    print("-" * 60)

    missing_sub_event = {"requestContext": {"authorizer": {"jwt": {"claims": {"email": "test@example.com"}}}}}

    try:
        extract_user_from_event(missing_sub_event)
        print("Should have raised ValueError")
        raise AssertionError("Should have raised ValueError")
    except ValueError as e:
        assert "missing user ID" in str(e)
        print(f"Correctly raised error: {e}")
        print("Test 5 passed")

    # Test 6: Email verified = false
    print("\n[Test 6] Email not verified")
    print("-" * 60)

    unverified_event = {
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "user-789",
                        "email": "unverified@example.com",
                        "email_verified": "false",  # String "false"
                    }
                }
            }
        }
    }

    user = extract_user_from_event(unverified_event)
    assert user["email_verified"] is False  # Boolean False
    print(f"Email verified correctly parsed as: {user['email_verified']}")
    print("Test 6 passed")

    # Test 7: require_auth function
    print("\n[Test 7] require_auth function")
    print("-" * 60)

    user = require_auth(valid_event)
    assert user["user_id"] == "abc-123-def-456"
    print(f"require_auth works: {user['user_id']}")
    print("Test 7 passed")

    print("\n" + "=" * 60)
    print("All 7 tests passed!")
    print("\nJWT utilities ready to use in Lambda handlers.")
    print("\nUsage example:")
    print("  from common.jwt_utils import get_user_id")
    print("  user_id = get_user_id(event)")
