# MIRA Backend API Documentation

This document outlines the API endpoints that the frontend expects the AWS backend to implement.

## Base URL Configuration

The frontend uses an environment variable for the API base URL:
- `VITE_API_BASE_URL` - Set this to your AWS backend URL
- Default: `http://localhost:3000/api`

Create a `.env` file in the frontend root:
```
VITE_API_BASE_URL=https://your-aws-backend.com/api
```

## Authentication

The frontend uses JWT token-based authentication stored in localStorage.

### Headers
All authenticated requests include:
```
Authorization: Bearer <token>
Content-Type: application/json
```

## API Endpoints

### Authentication Endpoints

#### POST `/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### POST `/auth/login`
Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### GET `/auth/me`
Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name"
}
```

### User Profile Endpoints

#### GET `/profiles?user_email=<email>`
Get user profiles filtered by email.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `user_email` - User's email address

**Response:**
```json
[
  {
    "id": "profile_id",
    "user_email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "birth_date": "1990-01-01",
    "birth_time": "14:30",
    "birth_location": "New York, NY",
    "timezone": "America/New_York"
  }
]
```

#### POST `/profiles`
Create a new user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "user_email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "birth_date": "1990-01-01",
  "birth_time": "14:30",
  "birth_location": "New York, NY",
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "id": "profile_id",
  "user_email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "birth_date": "1990-01-01",
  "birth_time": "14:30",
  "birth_location": "New York, NY",
  "timezone": "America/New_York",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### PUT `/profiles/:id`
Update an existing user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as POST `/profiles`

**Response:** Updated profile object

#### DELETE `/profiles/:id`
Delete a user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Profile deleted"
}
```

### Conversation Endpoints

#### GET `/conversations?agent_name=<agent_name>`
List all conversations for a specific agent.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `agent_name` - Name of the agent (e.g., "mira")

**Response:**
```json
[
  {
    "id": "conversation_id",
    "agent_name": "mira",
    "metadata": {
      "name": "Chat about birth chart"
    },
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
]
```

#### GET `/conversations/:id`
Get a specific conversation with all messages.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "conversation_id",
  "agent_name": "mira",
  "metadata": {
    "name": "Chat about birth chart"
  },
  "messages": [
    {
      "role": "user",
      "content": "What's my sun sign?",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Based on your birth date, your sun sign is...",
      "timestamp": "2024-01-01T00:00:01Z"
    }
  ],
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z"
}
```

#### POST `/conversations`
Create a new conversation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "agent_name": "mira",
  "metadata": {
    "name": "New Chat"
  }
}
```

**Response:**
```json
{
  "id": "conversation_id",
  "agent_name": "mira",
  "metadata": {
    "name": "New Chat"
  },
  "messages": [],
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z"
}
```

#### POST `/conversations/:id/messages`
Add a message to a conversation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "user",
  "content": "Tell me about my birth chart"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "role": "user",
    "content": "Tell me about my birth chart",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

**Note:** After adding a user message, the backend should:
1. Process the message with the AI agent
2. Generate a response
3. Send the response through the WebSocket connection (see below)

### WebSocket Endpoint

#### WS `/conversations/:id/subscribe`
Subscribe to real-time updates for a conversation.

**Protocol:** WebSocket

**Connection:** 
```javascript
const ws = new WebSocket('ws://your-backend.com/api/conversations/conversation_id/subscribe');
```

**Authentication:** Send token in connection URL or as first message:
```javascript
ws.send(JSON.stringify({ type: 'auth', token: 'jwt_token' }));
```

**Message Format (Server to Client):**
```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "Here's your birth chart analysis...",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

The frontend expects to receive the entire messages array each time there's an update.

## Error Handling

All endpoints should return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (triggers redirect to login in frontend)
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error message here",
  "details": "Optional additional details"
}
```

## CORS Configuration

The backend should allow requests from your frontend domain:

```
Access-Control-Allow-Origin: https://your-frontend-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Rate Limiting

Consider implementing rate limiting for:
- Authentication endpoints: 5 requests per minute
- Message endpoints: 10 requests per minute
- Other endpoints: 100 requests per minute

## Notes for Backend Team

1. **Authentication:** Implement JWT-based authentication with token expiration
2. **Database:** Store users, profiles, conversations, and messages
3. **AI Integration:** Connect to your LLM service (OpenAI, Anthropic, etc.) for generating responses
4. **WebSocket:** Implement WebSocket server for real-time message delivery
5. **Astrology Data:** Integrate astrology calculation APIs if needed
6. **Security:** 
   - Hash passwords with bcrypt
   - Validate all inputs
   - Implement SQL injection protection
   - Use HTTPS in production
7. **Monitoring:** Add logging and monitoring for API requests and errors

