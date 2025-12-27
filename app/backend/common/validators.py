"""
User profile validation logic.
Validates birth date, time, location, and country before storing in database.
"""

from datetime import date, datetime
from typing import Dict, Any

from pydantic import BaseModel, Field, field_validator, ValidationError


class UserProfileInput(BaseModel):
    """
    User profile input data model with validation.

    Validates:
    - First name and last name (required, reasonable length)
    - Birth date (valid format, not in future, reasonable range)
    - Birth time (valid 24-hour format)
    - Birth location (not empty, reasonable length)
    - Birth country (not empty, reasonable length)
    """

    first_name: str = Field(..., description="User's first name")
    last_name: str = Field(..., description="User's last name")
    birth_date: str = Field(..., description="Birth date in YYYY-MM-DD format")
    birth_time: str = Field(..., description="Birth time in HH:MM format (24-hour)")
    birth_location: str = Field(..., description="Birth location (city, state/province)")
    birth_country: str = Field(..., description="Birth country (e.g., United States, China)")

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, v: str) -> str:
        """
        Validate first name.

        Rules:
        - Cannot be empty or only whitespace
        - Must be between 1 and 50 characters
        - Can contain letters, spaces, hyphens, apostrophes

        Args:
            v: First name to validate

        Returns:
            Validated and trimmed first name

        Raises:
            ValueError: If name is invalid
        """
        trimmed = v.strip()

        if not trimmed:
            raise ValueError("First name cannot be empty")

        if len(trimmed) > 50:
            raise ValueError("First name must be at most 50 characters")

        # Allow letters, spaces, hyphens, apostrophes (e.g., "Mary-Jane", "O'Brien")
        import re

        if not re.match(r"^[a-zA-Z\s\-']+$", trimmed):
            raise ValueError("First name can only contain letters, spaces, hyphens, and apostrophes")

        return trimmed

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        """
        Validate last name.

        Rules:
        - Cannot be empty or only whitespace
        - Must be between 1 and 50 characters
        - Can contain letters, spaces, hyphens, apostrophes

        Args:
            v: Last name to validate

        Returns:
            Validated and trimmed last name

        Raises:
            ValueError: If name is invalid
        """
        trimmed = v.strip()

        if not trimmed:
            raise ValueError("Last name cannot be empty")

        if len(trimmed) > 50:
            raise ValueError("Last name must be at most 50 characters")

        # Allow letters, spaces, hyphens, apostrophes
        import re

        if not re.match(r"^[a-zA-Z\s\-']+$", trimmed):
            raise ValueError("Last name can only contain letters, spaces, hyphens, and apostrophes")

        return trimmed

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v: str) -> str:
        """
        Validate birth date.

        Rules:
        - Must be in YYYY-MM-DD format
        - Must be a valid date
        - Cannot be in the future
        - Cannot be before 1900-01-01 (reasonable lower bound)

        Args:
            v: Date string to validate

        Returns:
            Validated date string

        Raises:
            ValueError: If date is invalid
        """
        # Parse date
        try:
            parsed_date = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Invalid date format. Expected: YYYY-MM-DD (e.g., 1990-01-15)")

        # Check not in future
        if parsed_date > date.today():
            raise ValueError("Birth date cannot be in the future")

        # Check not too old (before 1900)
        if parsed_date < date(1900, 1, 1):
            raise ValueError("Birth date cannot be before 1900-01-01")

        return v

    @field_validator("birth_time")
    @classmethod
    def validate_birth_time(cls, v: str) -> str:
        """
        Validate birth time.

        Rules:
        - Must be in HH:MM format (24-hour)
        - Hour must be 0-23
        - Minute must be 0-59

        Args:
            v: Time string to validate

        Returns:
            Validated time string

        Raises:
            ValueError: If time is invalid
        """
        # Parse time
        try:
            datetime.strptime(v, "%H:%M").time()
        except ValueError:
            raise ValueError("Invalid time format. Expected: HH:MM (e.g., 14:30)")

        # Additional validation (already handled by strptime, but explicit)
        hour, minute = map(int, v.split(":"))
        if not (0 <= hour <= 23):
            raise ValueError("Hour must be between 0 and 23")
        if not (0 <= minute <= 59):
            raise ValueError("Minute must be between 0 and 59")

        return v

    @field_validator("birth_location")
    @classmethod
    def validate_birth_location(cls, v: str) -> str:
        """
        Validate birth location.

        Rules:
        - Cannot be empty or only whitespace
        - Must be between 2 and 100 characters
        - Should contain valid characters

        Args:
            v: Location string to validate

        Returns:
            Validated and trimmed location string

        Raises:
            ValueError: If location is invalid
        """
        # Trim whitespace
        trimmed = v.strip()

        # Check not empty
        if not trimmed:
            raise ValueError("Location cannot be empty")

        # Check length
        if len(trimmed) < 2:
            raise ValueError("Location must be at least 2 characters")
        if len(trimmed) > 100:
            raise ValueError("Location must be at most 100 characters")

        return trimmed

    @field_validator("birth_country")
    @classmethod
    def validate_birth_country(cls, v: str) -> str:
        """
        Validate birth country.

        Rules:
        - Cannot be empty or only whitespace
        - Must be between 2 and 100 characters

        Args:
            v: Country string to validate

        Returns:
            Validated and trimmed country string

        Raises:
            ValueError: If country is invalid
        """
        # Trim whitespace
        trimmed = v.strip()

        # Check not empty
        if not trimmed:
            raise ValueError("Country cannot be empty")

        # Check length
        if len(trimmed) < 2:
            raise ValueError("Country must be at least 2 characters")
        if len(trimmed) > 100:
            raise ValueError("Country must be at most 100 characters")

        return trimmed


def validate_user_profile(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate user profile data.

    This is the main validation function to be used by API handlers.

    Args:
        data: Dict containing birth_date, birth_time, birth_location, birth_country

    Returns:
        Validated data dict with trimmed/normalized values

    Raises:
        ValueError: If any validation fails (with clear error message)

    Example:
        >>> validate_user_profile({
        ...     "birth_date": "1990-01-15",
        ...     "birth_time": "14:30",
        ...     "birth_location": "New York, NY",
        ...     "birth_country": "United States"
        ... })
        {
            'birth_date': '1990-01-15',
            'birth_time': '14:30',
            'birth_location': 'New York, NY',
            'birth_country': 'United States'
        }
    """
    try:
        # Pydantic will validate all fields automatically
        profile = UserProfileInput(**data)

        # Return validated data as dict
        return {
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "birth_date": profile.birth_date,
            "birth_time": profile.birth_time,
            "birth_location": profile.birth_location,
            "birth_country": profile.birth_country,
        }

    except ValidationError as e:
        # Extract first error message for clarity
        first_error = e.errors()[0]
        field = first_error["loc"][0]
        msg = first_error["msg"]

        # Raise ValueError (will be caught by api_handler wrapper → 400 response)
        raise ValueError(f"Validation failed for {field}: {msg}")


# Local testing
if __name__ == "__main__":
    print("Testing User Profile Validation\n")
    print("=" * 60)

    # Test 1: Valid profile
    print("\n[Test 1] Valid profile data")
    print("-" * 60)
    valid_data = {
        "birth_date": "1990-01-15",
        "birth_time": "14:30",
        "birth_location": "New York, NY",
        "birth_country": "United States",
    }

    try:
        result = validate_user_profile(valid_data)
        print(f"Validation passed: {result}")
        assert result["birth_date"] == "1990-01-15"
        assert result["birth_time"] == "14:30"
        assert result["birth_location"] == "New York, NY"
        assert result["birth_country"] == "United States"
        print("✓ Test 1 passed")
    except ValueError as e:
        print(f"✗ Unexpected error: {e}")
        raise

    # Test 2: Invalid date format
    print("\n[Test 2] Invalid date format")
    print("-" * 60)
    invalid_date = {
        "birth_date": "15/01/1990",
        "birth_time": "14:30",
        "birth_location": "New York",
        "birth_country": "United States",
    }

    try:
        validate_user_profile(invalid_date)
        print("✗ Should have raised ValueError")
        raise AssertionError("Validation should have failed")
    except ValueError as e:
        print(f"✓ Correctly rejected: {e}")
        assert "date format" in str(e).lower()
        print("✓ Test 2 passed")

    # Test 3: Future date
    print("\n[Test 3] Future birth date")
    print("-" * 60)
    future_date = {
        "birth_date": "2030-12-31",
        "birth_time": "14:30",
        "birth_location": "New York",
        "birth_country": "United States",
    }

    try:
        validate_user_profile(future_date)
        print("✗ Should have raised ValueError")
        raise AssertionError("Validation should have failed")
    except ValueError as e:
        print(f"✓ Correctly rejected: {e}")
        assert "future" in str(e).lower()
        print("✓ Test 3 passed")

    # Test 4: Invalid time format
    print("\n[Test 4] Invalid time format")
    print("-" * 60)
    invalid_time = {
        "birth_date": "1990-01-15",
        "birth_time": "25:99",
        "birth_location": "New York",
        "birth_country": "United States",
    }

    try:
        validate_user_profile(invalid_time)
        print("✗ Should have raised ValueError")
        raise AssertionError("Validation should have failed")
    except ValueError as e:
        print(f"✓ Correctly rejected: {e}")
        assert "time format" in str(e).lower()
        print("✓ Test 4 passed")

    # Test 5: Empty location
    print("\n[Test 5] Empty location")
    print("-" * 60)
    empty_location = {
        "birth_date": "1990-01-15",
        "birth_time": "14:30",
        "birth_location": "   ",
        "birth_country": "United States",
    }

    try:
        validate_user_profile(empty_location)
        print("✗ Should have raised ValueError")
        raise AssertionError("Validation should have failed")
    except ValueError as e:
        print(f"✓ Correctly rejected: {e}")
        assert "empty" in str(e).lower()
        print("✓ Test 5 passed")

    # Test 6: Missing field (country)
    print("\n[Test 6] Missing required field (country)")
    print("-" * 60)
    missing_field = {
        "birth_date": "1990-01-15",
        "birth_time": "14:30",
        "birth_location": "New York, NY",
    }

    try:
        validate_user_profile(missing_field)
        print("✗ Should have raised ValueError")
        raise AssertionError("Validation should have failed")
    except ValueError as e:
        print(f"✓ Correctly rejected: {e}")
        print("✓ Test 6 passed")

    # Test 7: Very old date (edge case)
    print("\n[Test 7] Date before 1900")
    print("-" * 60)
    old_date = {
        "birth_date": "1850-01-15",
        "birth_time": "14:30",
        "birth_location": "London",
        "birth_country": "United Kingdom",
    }

    try:
        validate_user_profile(old_date)
        print("✗ Should have raised ValueError")
        raise AssertionError("Validation should have failed")
    except ValueError as e:
        print(f"✓ Correctly rejected: {e}")
        assert "1900" in str(e)
        print("✓ Test 7 passed")

    # Test 8: Location trimming
    print("\n[Test 8] Location with extra whitespace")
    print("-" * 60)
    whitespace_location = {
        "birth_date": "1990-01-15",
        "birth_time": "14:30",
        "birth_location": "  New York  ",
        "birth_country": "  United States  ",
    }

    try:
        result = validate_user_profile(whitespace_location)
        print("✓ Validation passed")
        print(f"  Location trimmed: '{result['birth_location']}'")
        print(f"  Country trimmed: '{result['birth_country']}'")
        assert result["birth_location"] == "New York"
        assert result["birth_country"] == "United States"
        print("✓ Test 8 passed")
    except ValueError as e:
        print(f"✗ Unexpected error: {e}")
        raise

    # Test 9: Empty country
    print("\n[Test 9] Empty country")
    print("-" * 60)
    empty_country = {
        "birth_date": "1990-01-15",
        "birth_time": "14:30",
        "birth_location": "New York, NY",
        "birth_country": "   ",
    }

    try:
        validate_user_profile(empty_country)
        print("✗ Should have raised ValueError")
        raise AssertionError("Validation should have failed")
    except ValueError as e:
        print(f"✓ Correctly rejected: {e}")
        assert "empty" in str(e).lower()
        print("✓ Test 9 passed")

    print("\n" + "=" * 60)
    print("All 9 tests passed! ✓")
    print("\nValidation module is ready to use.")
