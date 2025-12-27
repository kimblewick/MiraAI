# API Lambda Handlers

This directory contains Lambda functions for API Gateway endpoints.

## Current Handlers

- `handler.py` - Placeholder for API endpoint logic

## Adding New Handlers

Create new files following the pattern:
- `profile_handler.py` - For `/profile` endpoint
- `chat_handler.py` - For `/chat` endpoint
- `health_handler.py` - For `/health` endpoint
- ...

Each handler should export a `lambda_handler(event, context)` function.