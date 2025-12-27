"""
Zodiac sign calculation based on birth date.
Uses tropical zodiac system (Western astrology).
"""

from datetime import datetime


def calculate_zodiac_sign(birth_date: str) -> str:
    """
    Calculate zodiac sign from birth date.

    Uses tropical zodiac (Western astrology) based on the Sun's position.
    Date ranges are approximate and may vary by 1 day depending on the year.

    Args:
        birth_date: Date string in YYYY-MM-DD format (e.g., "1990-01-15")

    Returns:
        Zodiac sign name (e.g., "Capricorn")

    Example:
        >>> calculate_zodiac_sign("1990-01-15")
        'Capricorn'
        >>> calculate_zodiac_sign("1995-07-23")
        'Leo'
    """
    # Parse date to get month and day
    date_obj = datetime.strptime(birth_date, "%Y-%m-%d")
    month = date_obj.month
    day = date_obj.day

    # Zodiac date ranges (tropical/Western astrology)
    # Format: (start_month, start_day, end_month, end_day, sign_name)
    zodiac_ranges = [
        (12, 22, 1, 19, "Capricorn"),  # Dec 22 - Jan 19
        (1, 20, 2, 18, "Aquarius"),  # Jan 20 - Feb 18
        (2, 19, 3, 20, "Pisces"),  # Feb 19 - Mar 20
        (3, 21, 4, 19, "Aries"),  # Mar 21 - Apr 19
        (4, 20, 5, 20, "Taurus"),  # Apr 20 - May 20
        (5, 21, 6, 20, "Gemini"),  # May 21 - Jun 20
        (6, 21, 7, 22, "Cancer"),  # Jun 21 - Jul 22
        (7, 23, 8, 22, "Leo"),  # Jul 23 - Aug 22
        (8, 23, 9, 22, "Virgo"),  # Aug 23 - Sep 22
        (9, 23, 10, 22, "Libra"),  # Sep 23 - Oct 22
        (10, 23, 11, 21, "Scorpio"),  # Oct 23 - Nov 21
        (11, 22, 12, 21, "Sagittarius"),  # Nov 22 - Dec 21
    ]

    # Find matching zodiac sign
    for start_month, start_day, end_month, end_day, sign in zodiac_ranges:
        # Handle signs that span across year boundary (like Capricorn)
        if start_month > end_month:
            # Sign spans Dec-Jan
            if (month == start_month and day >= start_day) or (month == end_month and day <= end_day):
                return sign
        else:
            # Normal case: sign within same year
            if (
                (month == start_month and day >= start_day)
                or (month == end_month and day <= end_day)
                or (start_month < month < end_month)
            ):
                return sign

    # Fallback (should never reach here if ranges are correct)
    return "Unknown"


# Local testing
if __name__ == "__main__":
    print("Testing Zodiac Sign Calculator\n")
    print("=" * 70)

    # Test cases: (birth_date, expected_sign)
    test_cases = [
        ("1990-01-15", "Capricorn"),
        ("1990-01-20", "Aquarius"),
        ("1995-02-15", "Aquarius"),
        ("1995-03-15", "Pisces"),
        ("1988-04-10", "Aries"),
        ("1992-05-15", "Taurus"),
        ("1993-06-10", "Gemini"),
        ("1994-07-10", "Cancer"),
        ("1995-07-23", "Leo"),
        ("1996-08-25", "Virgo"),
        ("1997-09-25", "Libra"),
        ("1998-10-25", "Scorpio"),
        ("1999-11-25", "Sagittarius"),
        ("2000-12-25", "Capricorn"),
        # Edge cases (boundary dates)
        ("1990-12-22", "Capricorn"),  # First day of Capricorn
        ("1990-01-19", "Capricorn"),  # Last day of Capricorn
        ("1990-01-20", "Aquarius"),  # First day of Aquarius
    ]

    passed = 0
    failed = 0

    for birth_date, expected in test_cases:
        result = calculate_zodiac_sign(birth_date)
        status = "✓" if result == expected else "✗"

        if result == expected:
            passed += 1
        else:
            failed += 1

        print(f"{status} {birth_date} → {result:12s} (expected: {expected})")

    print("\n" + "=" * 70)
    print(f"Tests passed: {passed}/{len(test_cases)}")

    if failed > 0:
        print(f"Tests failed: {failed}")
    else:
        print("All tests passed! ✓")
