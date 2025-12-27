# Backend Development Guide

Python backend for Mira project Lambda functions.

## Prerequisites

- Python 3.10+
- pip

## Setup
```bash
# Create virtual environment
python3 -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify setup
python -c "import boto3; print('Setup successful!')"
```

## Project Structure
```
backend/
├── api/         # API Gateway Lambda handlers
├── worker/      # SQS-triggered Lambda handlers
├── common/      # Shared utilities
└── requirements.txt
```

## Local Testing
```bash
# Test API wrapper
python common/api_wrapper.py

# Test API handler
python api/handler.py

# Test Worker handler
python worker/handler.py
```

## Using the API Handler Wrapper

All API Lambda functions should use the `@api_handler` decorator for consistency.

### Basic Usage
```python
from common import api_handler

@api_handler
def lambda_handler(event, context):
    # Access parsed data
    body = event['parsed_body']        # JSON body as dict
    headers = event['headers']         # Request headers
    query = event['query_params']      # Query parameters
    path = event['path_params']        # Path parameters
    
    # Business logic here
    result = process_request(body)
    
    # Return dict - wrapper handles response formatting
    return {
        'message': 'Success',
        'data': result
    }
```

### What the Wrapper Handles

- Parses API Gateway event automatically
- Catches errors and returns proper status codes (400/500)
- Adds CORS headers
- Logs requests and errors
- Formats response for API Gateway

### Error Handling

The wrapper catches exceptions automatically:
- `ValueError` → Returns 400 (Bad Request)
- Other exceptions → Returns 500 (Internal Server Error)

### Example: Simple Handler
```python
from common import api_handler

@api_handler
def lambda_handler(event, context):
    name = event['parsed_body'].get('name')
    if not name:
        raise ValueError('Name is required')
    
    return {'message': f'Hello {name}'}
```

## Adding Dependencies
```bash
pip install <package-name>
pip freeze > requirements.txt
```

## Development Workflow

1. Create feature branch: `feature/backend-<description>`
2. Write code in appropriate directory
3. Use `@api_handler` for API endpoints
4. Test locally
5. Open PR to `dev`
6. CI will validate Python syntax