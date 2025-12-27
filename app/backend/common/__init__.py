"""
Common utilities package.
Shared code for API and Worker Lambdas.
"""

# Import api_handler so it can be used as:
# from common import api_handler
from .api_wrapper import api_handler

__all__ = ["api_handler"]
