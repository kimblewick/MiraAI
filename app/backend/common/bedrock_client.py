"""
Bedrock AI client for generating astrological guidance.
Uses OpenAI GPT model via Amazon Bedrock with VPC PrivateLink.
"""

import json
import logging
import time
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configuration
MODEL_ID = "openai.gpt-oss-20b-1:0"
DEFAULT_MAX_TOKENS = 1000
DEFAULT_TEMPERATURE = 0.7


class BedrockError(Exception):
    """Custom exception for Bedrock API errors."""

    def __init__(self, message: str, error_code: str = None, original_error: str = None):
        self.message = message
        self.error_code = error_code
        self.original_error = original_error
        super().__init__(self.message)

    def __str__(self):
        error_parts = [self.message]
        if self.error_code:
            error_parts.append(f"Code: {self.error_code}")
        if self.original_error:
            error_parts.append(f"Details: {self.original_error}")
        return " | ".join(error_parts)


class BedrockClient:
    """
    Client for interacting with Amazon Bedrock AI models.
    Generates astrological guidance using OpenAI GPT via VPC PrivateLink.
    """

    def __init__(self, region_name: str = "us-east-1"):
        """
        Initialize Bedrock client.

        Args:
            region_name: AWS region (default: us-east-1)
        """
        try:
            self.client = boto3.client("bedrock-runtime", region_name=region_name)
            self.model_id = MODEL_ID
            logger.info(f"BedrockClient initialized with model: {self.model_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Bedrock client: {e}")
            raise BedrockError(message="Failed to initialize Bedrock client", original_error=str(e))

    def generate_response(
        self,
        user_profile: Dict[str, Any],
        chart_data: Dict[str, Any],
        user_question: str,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMPERATURE,
    ) -> Dict[str, Any]:
        """
        Generate AI response based on user profile, chart data, and question.

        Args:
            user_profile: User profile dict containing zodiac_sign, birth_date, etc.
            chart_data: Complete astrology chart data from Astrologer API
            user_question: User's question or prompt
            max_tokens: Maximum tokens for response (default: 1000)
            temperature: Response randomness 0-1 (default: 0.7)

        Returns:
            Dict containing:
                - response: AI generated text
                - usage: Token usage statistics
                - model: Model ID used

        Raises:
            BedrockError: If Bedrock API call fails
        """
        logger.info(f"Generating AI response for question: {user_question[:100]}...")

        # Build messages
        try:
            messages = self._build_messages(user_profile, chart_data, user_question)
            logger.info(f"Built {len(messages)} messages for AI")
        except Exception as e:
            logger.error(f"Failed to build messages: {e}")
            raise BedrockError(message="Failed to build AI prompt", original_error=str(e))

        # Build request payload (OpenAI format)
        request_body = {
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        messages_str = json.dumps(messages)
        logger.info(f"Prompt size: {len(messages_str)} chars")

        # Call Bedrock
        try:
            logger.info("=" * 60)
            logger.info("BEDROCK REQUEST DEBUG")
            logger.info(f"Model: {self.model_id}")
            logger.info(f"Request size: {len(json.dumps(request_body))} bytes")
            logger.info(f"Full request: {json.dumps(request_body)[:2000]}...")
            logger.info("=" * 60)

            start_time = time.time()
            logger.info(f"Calling invoke_model at {start_time}")

            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json",
            )

            end_time = time.time()
            duration = end_time - start_time

            logger.info(f"invoke_model returned at {end_time}")
            logger.info(f"Duration: {duration:.2f} seconds")
            logger.info("=" * 60)
            logger.info("BEDROCK RESPONSE DEBUG")
            logger.info(f"HTTP Status: {response['ResponseMetadata']['HTTPStatusCode']}")
            logger.info(f"Request ID: {response['ResponseMetadata']['RequestId']}")
            logger.info("=" * 60)

            # Parse response
            response_body = json.loads(response["body"].read())
            logger.info(f"Response keys: {list(response_body.keys())}")
            if "usage" in response_body:
                usage = response_body["usage"]
                logger.info(f"Token usage: {usage}")
                logger.info(f"  Prompt tokens: {usage.get('prompt_tokens', 'N/A')}")
                logger.info(f"  Completion tokens: {usage.get('completion_tokens', 'N/A')}")
                logger.info(f"  Total tokens: {usage.get('total_tokens', 'N/A')}")
            logger.info("Bedrock response received successfully")

            return self._parse_response(response_body)

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            logger.error("=" * 60)
            logger.error("BEDROCK CLIENT ERROR")
            logger.error(f"Error code: {error_code}")
            logger.error(f"Error message: {error_message}")
            logger.error(f"Full response: {e.response}")
            logger.error("=" * 60)
            raise BedrockError(
                message="Bedrock API call failed",
                error_code=error_code,
                original_error=error_message,
            )

        except Exception as e:
            logger.error("=" * 60)
            logger.error("BEDROCK UNEXPECTED ERROR")
            logger.error(f"Type: {type(e).__name__}")
            logger.error(f"Message: {str(e)}")
            logger.error("=" * 60)
            logger.error("Full traceback:", exc_info=True)
            raise BedrockError(message="Unexpected error during AI generation", original_error=str(e))

    def _build_messages(
        self,
        user_profile: Dict[str, Any],
        chart_data: Dict[str, Any],
        user_question: str,
    ) -> list:
        """
        Build OpenAI-format messages with astrological context.

        Args:
            user_profile: User profile data
            chart_data: Complete astrology chart data
            user_question: User's question

        Returns:
            List of message dicts in OpenAI format
        """
        # System message - Define AI personality and role
        system_message = {
            "role": "system",
            "content": """You are Mira, an empathetic and insightful astrology companion.

Your role is to provide supportive, personalized guidance based on users' astrological birth charts.

Guidelines:
- Be warm, understanding, and non-judgmental
- Interpret astrological data in accessible, meaningful ways
- Focus on personal growth and self-awareness
- Avoid making absolute predictions
- Encourage users to use astrology as a tool for reflection, not fate
- Be concise but thoughtful in your responses

When analyzing charts, consider planetary positions, aspects, and houses to provide nuanced insights.""",
        }

        # User message - Include context and question
        user_context = self._format_user_context(user_profile, chart_data)

        user_message = {
            "role": "user",
            "content": f"{user_context}\n\nQuestion: {user_question}",
        }

        return [system_message, user_message]

    def _format_user_context(self, user_profile: Dict[str, Any], chart_data: Dict[str, Any]) -> str:
        """
        Format user profile and chart data into readable context.
        OPTIMIZED VERSION - Only includes key astrological information.

        Args:
            user_profile: User profile dict
            chart_data: Chart data from Astrologer API

        Returns:
            Formatted context string (optimized for token efficiency)
        """
        # Extract user profile info
        zodiac_sign = user_profile.get("zodiac_sign", "Unknown")
        birth_date = user_profile.get("birth_date", "Unknown")
        birth_location = user_profile.get("birth_location", "Unknown")

        # Extract KEY planets only
        chart_planets = chart_data.get("data", {})
        key_planets = [
            "sun",
            "moon",
            "mercury",
            "venus",
            "mars",
            "jupiter",
            "saturn",
            "ascendant",
            "medium_coeli",
        ]

        planets_summary = []
        for planet in key_planets:
            if planet in chart_planets:
                planet_data = chart_planets[planet]
                name = planet_data.get("name", planet.title())
                sign = planet_data.get("sign", "Unknown")
                position = planet_data.get("position", 0)
                retrograde = " (R)" if planet_data.get("retrograde", False) else ""

                planets_summary.append(f"  {name}: {sign} {position:.1f}°{retrograde}")

        # Extract MAJOR aspects only
        all_aspects = chart_data.get("aspects", [])
        important_aspect_types = [
            "conjunction",
            "opposition",
            "trine",
            "square",
            "sextile",
        ]
        key_planets_for_aspects = [
            "Sun",
            "Moon",
            "Ascendant",
            "Mercury",
            "Venus",
            "Mars",
        ]

        major_aspects = []
        for aspect in all_aspects[:20]:
            aspect_type = aspect.get("aspect", "").lower()
            planet1 = aspect.get("p1_name", "")
            planet2 = aspect.get("p2_name", "")

            if aspect_type in important_aspect_types:
                if planet1 in key_planets_for_aspects or planet2 in key_planets_for_aspects:
                    orb = aspect.get("orbit", 0)
                    major_aspects.append(f"  {planet1} {aspect_type} {planet2} (orb: {orb:.1f}°)")
                    if len(major_aspects) >= 10:
                        break

        # Build concise context
        context = f"""User Profile:
- Zodiac Sign: {zodiac_sign}
- Birth Date: {birth_date}
- Birth Location: {birth_location}

Key Planetary Positions:
{chr(10).join(planets_summary) if planets_summary else '  (No planetary data available)'}

Major Aspects:
{chr(10).join(major_aspects) if major_aspects else '  (No major aspects found)'}
"""

        return context

    def _parse_response(self, response_body: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Bedrock response into structured format.

        Args:
            response_body: Raw Bedrock API response

        Returns:
            Dict with response text, usage stats, and metadata
        """
        try:
            ai_message = response_body["choices"][0]["message"]["content"]
            usage = response_body.get("usage", {})

            return {
                "response": ai_message,
                "usage": {
                    "input_tokens": usage.get("prompt_tokens", 0),
                    "output_tokens": usage.get("completion_tokens", 0),
                },
                "model": self.model_id,
            }

        except (KeyError, IndexError) as e:
            logger.error(f"Failed to parse Bedrock response: {e}")
            logger.error(f"Response body: {response_body}")
            raise BedrockError(message="Invalid response format from Bedrock", original_error=str(e))


# Local testing
if __name__ == "__main__":
    print("Testing Bedrock AI Client\n")
    print("=" * 70)

    print("\n[Test Setup]")
    print("-" * 70)
    print("Ensure AWS credentials are configured")

    try:
        client = BedrockClient()
        print("\n✓ Bedrock client initialized successfully")
    except Exception as e:
        print(f"\n✗ Failed to initialize client: {e}")
        exit(1)

    # Test with simple data
    test_profile = {
        "zodiac_sign": "Capricorn",
        "birth_date": "1990-01-15",
        "birth_location": "New York, NY",
        "birth_country": "United States",
    }

    test_chart_data = {
        "data": {
            "Sun": {"sign": "Capricorn", "position": "24°15'"},
            "Moon": {"sign": "Pisces", "position": "12°30'"},
            "Ascendant": {"sign": "Virgo", "position": "5°45'"},
        },
        "aspects": [
            {"planet1": "Sun", "planet2": "Moon", "aspect": "sextile", "orb": 2.5},
            {"planet1": "Sun", "planet2": "Mars", "aspect": "square", "orb": 3.1},
        ],
    }

    test_question = "What does my Sun in Capricorn mean for my career?"

    print("\n[Test] Generate AI Response")
    print("-" * 70)
    print(f"Question: {test_question}")

    try:
        result = client.generate_response(
            user_profile=test_profile,
            chart_data=test_chart_data,
            user_question=test_question,
            max_tokens=500,
        )

        print("\n✓ AI response generated successfully!")
        print(f"\nResponse ({len(result['response'])} chars):")
        print("-" * 70)
        print(result["response"][:500])
        print("...")
        print("-" * 70)
        print("\nUsage:")
        print(f"  Input tokens: {result['usage']['input_tokens']}")
        print(f"  Output tokens: {result['usage']['output_tokens']}")
        print(f"  Model: {result['model']}")

    except BedrockError as e:
        print(f"\n✗ Bedrock Error: {e}")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")

    print("\n" + "=" * 70)
    print("Testing completed")
