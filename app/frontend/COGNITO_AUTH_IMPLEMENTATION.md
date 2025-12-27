# Cognito Authentication Implementation

## Overview

This document describes the AWS Cognito Hosted UI authentication implementation for the MIRA frontend. The implementation uses OAuth 2.0 implicit flow with Cognito's Hosted UI for secure user authentication.

## Architecture

### Components

1. **Cognito Auth Service** (`src/services/cognitoAuth.js`)
   - Handles redirect to Cognito Hosted UI
   - Parses OAuth tokens from URL
   - Manages token storage in localStorage
   - Provides authentication state methods

2. **Auth Context** (`src/contexts/AuthContext.jsx`)
   - React Context for authentication state
   - Provides hooks for components to access auth state
   - Manages user session across the app

3. **Callback Page** (`src/pages/Callback.jsx`)
   - Handles OAuth redirect from Cognito
   - Extracts and stores tokens
   - Redirects to appropriate page after login

4. **Protected Route** (`src/components/ProtectedRoute.jsx`)
   - Wrapper for routes requiring authentication
   - Redirects to landing page if not authenticated

## Authentication Flow

### Login Flow

```
1. User clicks "Begin Your Journey" on Landing page
   ↓
2. App redirects to Cognito Hosted UI
   URL: https://<domain>.auth.<region>.amazoncognito.com/oauth2/authorize
   ↓
3. User enters credentials on Cognito Hosted UI
   ↓
4. Cognito redirects back to app with tokens in URL hash
   URL: http://localhost:5173/callback#id_token=xxx&access_token=yyy
   ↓
5. Callback page extracts tokens from URL
   ↓
6. Tokens stored in localStorage
   ↓
7. User redirected to Onboarding page
```

### Token Storage

Tokens are stored in localStorage:
- `cognito_tokens`: Contains ID token, access token, expiry info
- `cognito_user_info`: Contains decoded user information from ID token

### Session Persistence

- Session persists across page refreshes via localStorage
- Tokens are validated on app startup
- Expired tokens are automatically cleared

## Configuration

### Environment Variables

Required variables in `.env`:

```env
# Cognito User Pool Configuration
VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_AWS_COGNITO_CLIENT_ID=your-app-client-id
VITE_AWS_COGNITO_DOMAIN=your-app.auth.us-east-1.amazoncognito.com

# AWS Region
VITE_AWS_REGION=us-east-1

# OAuth Callback URLs
VITE_COGNITO_CALLBACK_URL=http://localhost:5173/callback
VITE_COGNITO_LOGOUT_URL=http://localhost:5173/
```

### Cognito User Pool Setup

Your backend team should have configured:

1. **User Pool** with email/password authentication
2. **App Client** with:
   - Implicit grant OAuth flow enabled
   - `openid`, `email`, `profile` scopes
   - Callback URL: `http://localhost:5173/callback` (dev) / `https://your-domain.com/callback` (prod)
   - Sign-out URL: `http://localhost:5173/` (dev) / `https://your-domain.com/` (prod)
3. **Hosted UI** domain configured

## Usage

### In Components

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <button onClick={login}>Login</button>;
  }
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```javascript
import ProtectedRoute from '../components/ProtectedRoute';

<Route path="/protected" element={
  <ProtectedRoute>
    <ProtectedPage />
  </ProtectedRoute>
} />
```

### Making Authenticated API Calls

The API client automatically includes the JWT token:

```javascript
import { apiClient } from '../api/apiClient';

// Token automatically included in Authorization header
const data = await apiClient.request('/api/endpoint');
```

## Token Format

### ID Token (JWT)

Contains user information:
```json
{
  "sub": "user-id-uuid",
  "email": "user@example.com",
  "email_verified": true,
  "cognito:username": "username",
  "name": "User Name",
  "given_name": "User",
  "family_name": "Name",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Access Token

Used for API authorization:
- Format: JWT token
- Sent in `Authorization: Bearer <token>` header
- Validated by backend API

## Security Considerations

### What's Secure ✅

- Tokens issued by AWS Cognito
- HTTPS in production
- Tokens stored in localStorage (acceptable for web apps)
- Automatic token expiration
- Backend validates JWT signatures

### Best Practices Implemented

1. **No credentials in frontend code** - All auth through Cognito
2. **Token expiration** - Tokens expire after configured time
3. **Secure redirect URLs** - Only whitelisted URLs allowed
4. **HTTPS enforcement** - Use HTTPS in production
5. **Token in Authorization header** - Not in URL parameters

### Known Limitations

1. **localStorage** - Vulnerable to XSS attacks (use httpOnly cookies for higher security)
2. **Implicit flow** - Less secure than Authorization Code flow with PKCE
3. **No refresh tokens** - User must re-authenticate after token expiry

For production, consider:
- Using Authorization Code flow with PKCE instead of implicit flow
- Implementing token refresh mechanism
- Using httpOnly cookies for token storage
- Adding CSRF protection

## Debugging

### Console Logs

The implementation includes debug logging:

```javascript
// On successful login
console.log('🎉 Authentication successful!');
console.log('📋 ID Token:', tokens.idToken);
console.log('🔑 Access Token:', tokens.accessToken);
console.log('👤 User Info:', userInfo);
```

### Common Issues

**Issue: "No tokens found in URL"**
- Check that Cognito redirects to correct callback URL
- Verify callback URL is whitelisted in Cognito App Client settings

**Issue: "Cognito domain and client ID must be configured"**
- Check environment variables are set correctly
- Ensure variables have `VITE_` prefix
- Restart dev server after changing `.env`

**Issue: "Authentication fails silently"**
- Open browser console for error messages
- Check Network tab for redirect URLs
- Verify Cognito User Pool and App Client are configured correctly

### Testing Without Backend

The frontend authentication works independently:
1. Set up Cognito User Pool (backend team)
2. Configure environment variables
3. Test login flow
4. Verify JWT token in console

Backend integration comes later - tokens just need to be passed to API.

## API Integration

### Current Implementation

The API client (`src/api/apiClient.js`) automatically:
1. Gets ID token from Cognito auth service
2. Adds `Authorization: Bearer <token>` header to all requests
3. Handles 401 responses by clearing session

### Backend Requirements

Your backend API should:
1. Validate JWT signature against Cognito public keys
2. Verify token expiration
3. Extract user ID from `sub` claim
4. Return 401 for invalid/expired tokens

Example backend validation (conceptual):
```python
from jose import jwt
import requests

# Get Cognito public keys
keys_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
keys = requests.get(keys_url).json()['keys']

# Validate token
decoded = jwt.decode(
    token,
    keys,
    audience=client_id,
    issuer=f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}'
)

user_id = decoded['sub']
email = decoded['email']
```

## Files Modified

### Created

- `src/services/cognitoAuth.js` - Cognito authentication service
- `src/contexts/AuthContext.jsx` - React authentication context
- `src/pages/Callback.jsx` - OAuth callback page
- `src/components/ProtectedRoute.jsx` - Protected route wrapper

### Modified

- `src/pages/Landing.jsx` - Added Cognito login integration
- `src/pages/index.jsx` - Added AuthProvider and protected routes
- `src/api/apiClient.js` - Updated to use Cognito tokens
- `src/config/env.js` - Added Cognito configuration
- `.env.example` - Added Cognito environment variables

## Testing Checklist

- ✅ Build completes successfully
- ✅ No linter errors
- ✅ Landing page shows "Begin Your Journey" button
- ⚠️ Clicking button redirects to Cognito (requires configured Cognito)
- ⚠️ After login, callback page processes tokens (requires configured Cognito)
- ⚠️ User redirected to onboarding after successful login (requires configured Cognito)
- ✅ Protected routes redirect to landing if not authenticated
- ✅ API calls include Authorization header when authenticated

**Note:** Full testing requires Cognito User Pool configuration from backend team.

## Next Steps

1. **Get Cognito credentials from backend team:**
   - User Pool ID
   - App Client ID
   - Cognito Domain
   
2. **Add to `.env` file**

3. **Test full authentication flow:**
   - Login
   - Token storage
   - Protected routes
   - Logout

4. **Backend integration:**
   - Verify API accepts Cognito JWT tokens
   - Test authenticated API calls
   - Handle token expiration

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify environment variables in `.env`
3. Review `ENV_SETUP.md` for configuration details
4. Contact backend team for Cognito configuration issues

