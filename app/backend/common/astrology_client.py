"""
Astrology API client for generating birth charts.
Integrates with external Astrologer API via NAT Gateway.
"""

import json
import logging
import os
import time
from typing import Any, Dict

import boto3
import pycountry
import requests
from botocore.exceptions import ClientError

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configuration
RAPIDAPI_HOST = "astrologer.p.rapidapi.com"
RAPIDAPI_BASE_URL = f"https://{RAPIDAPI_HOST}"
BIRTH_CHART_ENDPOINT = "/api/v4/birth-chart"
REQUEST_TIMEOUT = 4  # seconds
MAX_RETRIES = 3
RETRY_BACKOFF = [1, 2, 4]  # Exponential backoff in seconds


class AstrologyAPIError(Exception):
    """Custom exception for Astrology API errors."""

    def __init__(
        self,
        message: str,
        status_code: int = None,
        retry_count: int = 0,
        original_error: str = None,
    ):
        self.message = message
        self.status_code = status_code
        self.retry_count = retry_count
        self.original_error = original_error
        super().__init__(self.message)

    def __str__(self):
        error_parts = [self.message]
        if self.status_code:
            error_parts.append(f"Status: {self.status_code}")
        if self.retry_count:
            error_parts.append(f"Retries: {self.retry_count}")
        if self.original_error:
            error_parts.append(f"Original: {self.original_error}")
        return " | ".join(error_parts)


class AstrologyClient:
    """
    Client for interacting with Astrologer API.
    Handles birth chart generation with retry logic and timeout enforcement.
    """

    def __init__(self):
        """
        Initialize Astrology API client.
        Retrieves API key from Secrets Manager and Geonames username from environment.
        """
        self.api_key = self._get_api_key()
        self.geonames_username = os.environ.get("GEONAMES_USERNAME", "")

        if not self.geonames_username:
            logger.warning("GEONAMES_USERNAME not set in environment variables")

        logger.info("AstrologyClient initialized")

    def _get_api_key(self) -> str:
        """
        Retrieve Astrologer API key from AWS Secrets Manager.

        Returns:
            API key string

        Raises:
            AstrologyAPIError: If secret cannot be retrieved
        """
        secret_name = os.environ.get("ASTROLOGY_SECRET_NAME", "/mira/astrology/api_key")

        try:
            client = boto3.client("secretsmanager")
            response = client.get_secret_value(SecretId=secret_name)

            secret_data = json.loads(response["SecretString"])
            api_key = secret_data.get("api_key")

            if not api_key:
                raise ValueError("API key not found in secret")

            logger.info(f"Successfully retrieved API key from {secret_name}")
            return api_key

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error(f"Failed to retrieve secret: {error_code}")
            raise AstrologyAPIError(
                message="Failed to retrieve API key from Secrets Manager",
                original_error=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error retrieving API key: {e}")
            raise AstrologyAPIError(
                message="Failed to initialize Astrology API client",
                original_error=str(e),
            )

    def get_birth_chart(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate birth chart for a user.

        Args:
            user_profile: Dict containing:
                - birth_date: "1990-01-15"
                - birth_time: "14:30"
                - birth_location: "New York, NY"
                - birth_country: "United States"

        Returns:
            Dict containing:
                - svg_content: SVG string of the chart
                - chart_data: Complete chart data (planets, aspects, houses, etc.)
                - metadata: Generation metadata

        Raises:
            AstrologyAPIError: If API call fails after retries
        """
        logger.info(f"Generating birth chart for user profile: {user_profile.get('birth_location')}")

        # Build request payload
        try:
            payload = self._build_request_payload(user_profile)
            logger.info(f"Request payload built: {json.dumps(payload, default=str)}")
        except Exception as e:
            logger.error(f"Failed to build request payload: {e}")
            raise AstrologyAPIError(message="Invalid user profile data", original_error=str(e))

        # Make API call with retry logic
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Attempt {attempt + 1}/{MAX_RETRIES} to call Astrologer API")

                response = self._make_api_request(payload, timeout=REQUEST_TIMEOUT)

                logger.info("Birth chart generated successfully")
                return self._parse_response(response)

            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout on attempt {attempt + 1}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_BACKOFF[attempt])
                else:
                    raise AstrologyAPIError(
                        message="Request timeout after retries",
                        retry_count=MAX_RETRIES,
                        original_error="Timeout exceeded",
                    )

            except requests.exceptions.RequestException as e:
                logger.warning(f"Request failed on attempt {attempt + 1}: {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_BACKOFF[attempt])
                else:
                    raise AstrologyAPIError(
                        message="API request failed after retries",
                        retry_count=MAX_RETRIES,
                        original_error=str(e),
                    )

            except AstrologyAPIError:
                # Already an AstrologyAPIError, re-raise
                raise

            except Exception as e:
                logger.error(f"Unexpected error during API call: {e}", exc_info=True)
                raise AstrologyAPIError(
                    message="Unexpected error calling Astrology API",
                    original_error=str(e),
                )

    def _build_request_payload(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build API request payload from user profile.

        Converts user profile data to Astrologer API format.
        """
        # Parse birth date
        birth_date = user_profile["birth_date"]  # "1990-01-15"
        year, month, day = map(int, birth_date.split("-"))

        # Parse birth time
        birth_time = user_profile["birth_time"]  # "14:30"
        hour, minute = map(int, birth_time.split(":"))

        # Extract city from location
        birth_location = user_profile["birth_location"]  # "New York, NY"
        city = self._parse_city(birth_location)

        # Convert country name to ISO code
        birth_country = user_profile["birth_country"]  # "United States"
        nation_code = self._country_to_code(birth_country)

        # Build full name from profile
        first_name = user_profile.get("first_name", "")
        last_name = user_profile.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() or "User"

        subject = {
            "year": year,
            "month": month,
            "day": day,
            "hour": hour,
            "minute": minute,
            "city": city,
            "nation": nation_code,
            "name": full_name,
            "zodiac_type": "Tropic",  # Western astrology
        }

        # Add geonames username if available (for automatic coordinates)
        if self.geonames_username:
            subject["geonames_username"] = self.geonames_username
        else:
            logger.warning("Geonames username not configured, API may require manual coordinates")

        return {"subject": subject, "theme": "dark"}

    def _parse_city(self, birth_location: str) -> str:
        """
        Extract city name from location string.

        Examples:
            "New York, NY" → "New York"
            "London" → "London"
        """
        # Simple split by comma, take first part
        city = birth_location.split(",")[0].strip()
        return city

    def _country_to_code(self, country_name: str) -> str:
        """
        Convert country name to ISO 3166-1 alpha-2 code.

        Uses pycountry for fuzzy matching.

        Examples:
            "United States" → "US"
            "China" → "CN"
            "United Kingdom" → "GB"

        Args:
            country_name: Full country name

        Returns:
            Two-letter country code

        Raises:
            ValueError: If country cannot be found
        """
        try:
            country = pycountry.countries.search_fuzzy(country_name)[0]
            return country.alpha_2
        except LookupError:
            logger.error(f"Could not find country code for: {country_name}")
            raise ValueError(f"Unknown country: {country_name}")

    def _make_api_request(self, payload: Dict[str, Any], timeout: int) -> Dict[str, Any]:
        """
        Make HTTP request to Astrologer API.

        Args:
            payload: Request body
            timeout: Request timeout in seconds

        Returns:
            API response as dict

        Raises:
            AstrologyAPIError: If API returns error
            requests.exceptions.RequestException: If request fails
        """
        url = f"{RAPIDAPI_BASE_URL}{BIRTH_CHART_ENDPOINT}"

        headers = {
            "X-RapidAPI-Host": RAPIDAPI_HOST,
            "X-RapidAPI-Key": self.api_key,
            "Content-Type": "application/json",
        }

        logger.info(f"Calling Astrologer API: {url}")

        response = requests.post(url, json=payload, headers=headers, timeout=timeout)

        # Check for HTTP errors
        if response.status_code != 200:
            error_message = f"API returned status {response.status_code}"
            try:
                error_body = response.json()
                error_message += f": {error_body}"
            except Exception:
                error_message += f": {response.text}"

            logger.error(error_message)
            raise AstrologyAPIError(
                message="Astrologer API error",
                status_code=response.status_code,
                original_error=error_message,
            )

        return response.json()

    def _parse_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse and structure API response.

        Args:
            response: Raw API response

        Returns:
            Structured dict with svg_content, chart_data, and metadata
        """
        return {
            "svg_content": response.get("chart", ""),
            "chart_data": response,  # Keep complete response
            "metadata": {
                "generated_at": int(time.time()),
                "api_provider": "astrologer",
                "api_version": "v4",
            },
        }


# Local testing
if __name__ == "__main__":
    print("Testing Astrology API Client\n")
    print("=" * 70)

    # Note: This requires AWS credentials and Secrets Manager access
    # Set environment variables before testing:
    # export AWS_DEFAULT_REGION=us-east-1
    # export GEONAMES_USERNAME=your-username

    print("\n[Test Setup]")
    print("-" * 70)
    print("Ensure the following environment variables are set:")
    print("  - AWS_DEFAULT_REGION=us-east-1")
    print("  - GEONAMES_USERNAME=<your-geonames-username>")
    print("  - AWS credentials configured (aws configure)")

    # Initialize client
    try:
        client = AstrologyClient()
        print("\n✓ Client initialized successfully")
    except Exception as e:
        print(f"\n✗ Failed to initialize client: {e}")
        exit(1)

    # Test profile
    test_profile = {
        "birth_date": "1990-01-15",
        "birth_time": "14:30",
        "birth_location": "New York, NY",
        "birth_country": "United States",
    }

    print("\n[Test] Generate Birth Chart")
    print("-" * 70)
    print(f"Test profile: {test_profile}")

    try:
        result = client.get_birth_chart(test_profile)

        print("\n[Debug] Full API Response:")
        print(json.dumps(result["chart_data"], indent=2)[:2000])
        print("\n" + "=" * 70)

        print("\n✓ Birth chart generated successfully!")
        print(f"\nSVG length: {len(result['svg_content'])} characters")
        print(f"Chart data keys: {list(result['chart_data'].keys())}")
        print(f"Metadata: {result['metadata']}")

        # Check if SVG is valid
        if "<svg" in result["svg_content"]:
            print("\n✓ SVG content is valid")
            with open("test_chart.svg", "w", encoding="utf-8") as f:
                f.write(result["svg_content"])
            print("✓ SVG saved to: test_chart.svg")
            print("  → Open this file in your browser to view the birth chart!")
        else:
            print("\n⚠ SVG content may be invalid")

    except AstrologyAPIError as e:
        print(f"\n✗ API Error: {e}")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")

    print("\n" + "=" * 70)
    print("Testing completed")
