# Environment Variables Setup Guide

This guide explains how to set up and manage environment variables for the MIRA frontend application.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables Reference](#environment-variables-reference)
- [Configuration for Different Environments](#configuration-for-different-environments)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Copy the Example File

The repository includes a `.env.example` file with all available configuration options:

```bash
cp .env.example .env
```

### 2. Fill in Required Values

Open the `.env` file and fill in the required values. At minimum, you need:

```env
# Required: API Gateway endpoint
VITE_API_BASE_URL=http://localhost:3000/api

# Required for authentication: AWS Cognito configuration
VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_AWS_COGNITO_CLIENT_ID=your-app-client-id
VITE_AWS_COGNITO_DOMAIN=your-app.auth.us-east-1.amazoncognito.com

# Required: AWS Region
VITE_AWS_REGION=us-east-1

# OAuth callback URLs (auto-detected if not set)
VITE_COGNITO_CALLBACK_URL=http://localhost:5173/callback
VITE_COGNITO_LOGOUT_URL=http://localhost:5173/
```

### 3. Start the Development Server

```bash
npm run dev
```

**Important:** Restart the dev server whenever you change the `.env` file.

## Environment Variables Reference

### API Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | ✅ Yes | Base URL for backend API (API Gateway endpoint) | `https://abc123.execute-api.us-east-1.amazonaws.com/prod` |

### AWS Cognito Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_AWS_COGNITO_USER_POOL_ID` | ✅ Yes | Cognito User Pool ID | `us-east-1_abc123xyz` |
| `VITE_AWS_COGNITO_CLIENT_ID` | ✅ Yes | Cognito App Client ID | `1a2b3c4d5e6f7g8h9i0j1k2l3m` |
| `VITE_AWS_COGNITO_DOMAIN` | ✅ Yes | Cognito hosted UI domain | `your-app.auth.us-east-1.amazoncognito.com` |
| `VITE_AWS_COGNITO_IDENTITY_POOL_ID` | ⚪ Optional | Identity Pool ID for federated identities | `us-east-1:12345678-1234-1234-1234-123456789012` |

### AWS Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_AWS_REGION` | ✅ Yes | AWS region for all services | `us-east-1`, `us-west-2`, `eu-west-1` |

### WebSocket Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_WEBSOCKET_URL` | ⚪ Optional | WebSocket endpoint for real-time chat | `wss://xyz789.execute-api.us-east-1.amazonaws.com/prod` |

### Cognito OAuth Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_COGNITO_CALLBACK_URL` | ⚪ Optional | OAuth callback URL (auto-detected if not set) | `http://localhost:5173/callback` |
| `VITE_COGNITO_LOGOUT_URL` | ⚪ Optional | Logout redirect URL (auto-detected if not set) | `http://localhost:5173/` |

### Application Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_APP_ENV` | ⚪ Optional | Application environment | `development`, `staging`, `production` |
| `VITE_APP_VERSION` | ⚪ Optional | Application version | `1.0.0` |
| `VITE_DEBUG_MODE` | ⚪ Optional | Enable debug logging | `true`, `false` |

### Feature Flags

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_FEATURE_CHAT` | ⚪ Optional | Enable chat feature | `true` |
| `VITE_FEATURE_PROFILE` | ⚪ Optional | Enable profile feature | `true` |
| `VITE_FEATURE_VISUALIZATIONS` | ⚪ Optional | Enable visualizations | `true` |

## Configuration for Different Environments

### Local Development

Create `.env` for local development:

```env
# Local Backend
VITE_API_BASE_URL=http://localhost:3000/api

# AWS Cognito (use development pool)
VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_devpool123
VITE_AWS_COGNITO_CLIENT_ID=dev-client-id-here

# AWS Region
VITE_AWS_REGION=us-east-1

# Development Settings
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

### Staging Environment

Create `.env.staging` for staging:

```env
# Staging API Gateway
VITE_API_BASE_URL=https://staging-api-id.execute-api.us-east-1.amazonaws.com/staging

# AWS Cognito (staging pool)
VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_stagingpool
VITE_AWS_COGNITO_CLIENT_ID=staging-client-id-here

# AWS Region
VITE_AWS_REGION=us-east-1

# WebSocket
VITE_WEBSOCKET_URL=wss://staging-ws-id.execute-api.us-east-1.amazonaws.com/staging

# Staging Settings
VITE_APP_ENV=staging
VITE_DEBUG_MODE=false
```

### Production Environment

Create `.env.production` for production:

```env
# Production API Gateway
VITE_API_BASE_URL=https://prod-api-id.execute-api.us-east-1.amazonaws.com/prod

# AWS Cognito (production pool)
VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_prodpool
VITE_AWS_COGNITO_CLIENT_ID=prod-client-id-here

# AWS Region
VITE_AWS_REGION=us-east-1

# WebSocket
VITE_WEBSOCKET_URL=wss://prod-ws-id.execute-api.us-east-1.amazonaws.com/prod

# Production Settings
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_APP_VERSION=1.0.0
```

## Security Best Practices

### 🔒 DO

✅ **Keep `.env` files in `.gitignore`** - Never commit environment files  
✅ **Use `.env.example` as a template** - Share this with your team  
✅ **Rotate credentials regularly** - Update Cognito client secrets periodically  
✅ **Use different values per environment** - Separate dev/staging/prod credentials  
✅ **Document required variables** - Keep `.env.example` up to date  
✅ **Store production secrets securely** - Use AWS Secrets Manager or similar

### 🚫 DON'T

❌ **Never commit `.env` files** - They contain sensitive information  
❌ **Don't share `.env` files via chat/email** - Use secure channels  
❌ **Don't hardcode secrets in code** - Always use environment variables  
❌ **Don't use production credentials locally** - Use development credentials  
❌ **Don't log environment variables** - Avoid exposing them in logs

## How to Get AWS Values

### Getting Cognito Configuration

1. **Log into AWS Console**
2. **Navigate to Cognito** → User Pools
3. **Select your User Pool**
4. **Copy the Pool ID** from the Pool details page
   - Format: `us-east-1_xxxxxxxxx`
5. **Go to App Integration** → App clients
6. **Copy the Client ID** from your app client
   - Format: alphanumeric string

### Getting API Gateway URL

1. **Log into AWS Console**
2. **Navigate to API Gateway**
3. **Select your API**
4. **Go to Stages** → Select stage (e.g., `prod`)
5. **Copy the Invoke URL**
   - Format: `https://abc123.execute-api.region.amazonaws.com/stage`

### Getting WebSocket URL

1. **Log into AWS Console**
2. **Navigate to API Gateway**
3. **Select WebSocket API**
4. **Go to Stages** → Select stage
5. **Copy the WebSocket URL**
   - Format: `wss://abc123.execute-api.region.amazonaws.com/stage`

## Troubleshooting

### Environment Variables Not Loading

**Problem:** Changes to `.env` aren't reflected in the app

**Solution:**
1. Restart the Vite dev server (`npm run dev`)
2. Verify variable names start with `VITE_`
3. Check for syntax errors in `.env` file
4. Clear browser cache and reload

### Cognito Authentication Fails

**Problem:** Unable to authenticate with Cognito

**Solution:**
1. Verify `VITE_AWS_COGNITO_USER_POOL_ID` is correct
2. Verify `VITE_AWS_COGNITO_CLIENT_ID` is correct
3. Check that `VITE_AWS_REGION` matches your Cognito region
4. Ensure the App Client has the correct OAuth flows enabled

### API Requests Fail

**Problem:** API requests return 404 or connection errors

**Solution:**
1. Verify `VITE_API_BASE_URL` is correct
2. Check that the API Gateway stage is deployed
3. Test the API endpoint with curl or Postman
4. Check CORS configuration on the backend
5. Verify the backend is running (for local development)

### Build Fails

**Problem:** Build fails with environment variable errors

**Solution:**
1. Ensure all required variables are set
2. Check for typos in variable names
3. Verify `.env` file exists in the correct directory
4. For production builds, ensure `.env.production` exists

## Accessing Environment Variables in Code

In your React components or JavaScript files:

```javascript
// Accessing environment variables
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const region = import.meta.env.VITE_AWS_REGION;
const userPoolId = import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID;

// Check if variable is defined
if (!import.meta.env.VITE_API_BASE_URL) {
  console.error('API URL is not configured');
}

// Development vs Production
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
```

## Important Notes

1. **VITE_ Prefix Required:** All custom environment variables must start with `VITE_` to be exposed to your app. This is a Vite security feature.

2. **Build Time:** Environment variables are injected at build time, not runtime. Changes require rebuilding the app.

3. **Not Secret:** Frontend environment variables are not secret! They're embedded in the built JavaScript. Never put sensitive keys here.

4. **Mode-Specific Files:** Vite loads `.env.[mode]` files based on the mode:
   - `npm run dev` → `.env.development`
   - `npm run build` → `.env.production`
   - Base `.env` is always loaded

## Additional Resources

- [Vite Environment Variables Docs](https://vitejs.dev/guide/env-and-mode.html)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

