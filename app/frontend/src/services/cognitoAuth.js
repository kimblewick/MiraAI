/**
 * Cognito Authentication Service
 * 
 * Handles authentication using AWS Cognito Hosted UI with OAuth 2.0 flow.
 * This service manages:
 * - Redirecting to Cognito Hosted UI for login/signup
 * - Handling OAuth callback and token extraction
 * - Storing and managing JWT tokens
 * - Token validation and user info extraction
 * 
 * Note: We don't use amazon-cognito-identity-js because we're using Hosted UI OAuth flow,
 * not the SDK's direct authentication methods.
 */

import config from '../config/env.js';

// Storage keys
const TOKEN_STORAGE_KEY = 'cognito_tokens';
const USER_INFO_STORAGE_KEY = 'cognito_user_info';

/**
 * Build the Cognito Hosted UI URL
 */
const buildCognitoHostedUIUrl = (type = 'login') => {
  const { domain, clientId } = config.aws.cognito;
  const callbackUrl = config.cognito.callbackUrl;
  const logoutUrl = config.cognito.logoutUrl;
  
  if (!domain || !clientId) {
    throw new Error('Cognito domain and client ID must be configured. See ENV_SETUP.md');
  }
  
  // Ensure domain has proper format
  const cognitoDomain = domain.startsWith('https://') ? domain : `https://${domain}`;
  
  if (type === 'logout') {
    // Logout URL
    return `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUrl)}`;
  }
  
  // Login/Signup URL with OAuth 2.0 parameters
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'token', // Using implicit flow for simplicity
    scope: 'openid email profile', // Request user info
    redirect_uri: callbackUrl,
  });
  
  return `${cognitoDomain}/oauth2/authorize?${params.toString()}`;
};

/**
 * Parse tokens from URL hash fragment (OAuth implicit flow)
 * Format: #id_token=xxx&access_token=yyy&token_type=Bearer&expires_in=3600
 */
const parseTokensFromUrl = () => {
  const hash = window.location.hash.substring(1); // Remove #
  const params = new URLSearchParams(hash);
  
  const idToken = params.get('id_token');
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  const tokenType = params.get('token_type');
  
  if (idToken && accessToken) {
    return {
      idToken,
      accessToken,
      expiresIn: expiresIn ? parseInt(expiresIn) : 3600,
      tokenType: tokenType || 'Bearer',
      expiresAt: Date.now() + (parseInt(expiresIn) || 3600) * 1000,
    };
  }
  
  return null;
};

/**
 * Decode JWT token (without verification - server should verify)
 */
const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Extract user info from ID token
 */
const extractUserInfo = (idToken) => {
  const payload = decodeJWT(idToken);
  if (!payload) return null;
  
  return {
    sub: payload.sub, // User ID
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name || payload['cognito:username'],
    username: payload['cognito:username'],
    given_name: payload.given_name,
    family_name: payload.family_name,
    exp: payload.exp,
    iat: payload.iat,
  };
};

/**
 * Cognito Auth Service
 */
class CognitoAuthService {
  constructor() {
    this.tokens = null;
    this.userInfo = null;
    this.loadFromStorage();
  }
  
  /**
   * Load tokens and user info from localStorage
   */
  loadFromStorage() {
    try {
      const tokensStr = localStorage.getItem(TOKEN_STORAGE_KEY);
      const userInfoStr = localStorage.getItem(USER_INFO_STORAGE_KEY);
      
      if (tokensStr) {
        this.tokens = JSON.parse(tokensStr);
        
        // Check if token is expired
        if (this.tokens.expiresAt && this.tokens.expiresAt < Date.now()) {
          console.warn('Token expired, clearing session');
          this.clearSession();
          return;
        }
      }
      
      if (userInfoStr) {
        this.userInfo = JSON.parse(userInfoStr);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      this.clearSession();
    }
  }
  
  /**
   * Save tokens and user info to localStorage
   */
  saveToStorage() {
    try {
      if (this.tokens) {
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(this.tokens));
      }
      if (this.userInfo) {
        localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(this.userInfo));
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }
  
  /**
   * Clear session data
   */
  clearSession() {
    this.tokens = null;
    this.userInfo = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_INFO_STORAGE_KEY);
    // Also clear old auth_token if exists
    localStorage.removeItem('auth_token');
  }
  
  /**
   * Redirect to Cognito Hosted UI for login
   */
  login() {
    try {
      const loginUrl = buildCognitoHostedUIUrl('login');
      console.log('🔐 Redirecting to Cognito Hosted UI for login...');
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Error initiating login:', error);
      throw error;
    }
  }
  
  /**
   * Redirect to Cognito Hosted UI for signup
   */
  signup() {
    try {
      // Cognito Hosted UI uses same URL, it has both login and signup tabs
      const signupUrl = buildCognitoHostedUIUrl('login');
      console.log('📝 Redirecting to Cognito Hosted UI for signup...');
      window.location.href = signupUrl;
    } catch (error) {
      console.error('Error initiating signup:', error);
      throw error;
    }
  }
  
  /**
   * Handle OAuth callback - extract and store tokens
   */
  handleCallback() {
    try {
      const tokens = parseTokensFromUrl();
      
      if (!tokens) {
        console.warn('No tokens found in URL');
        return false;
      }
      
      // Store tokens
      this.tokens = tokens;
      
      // Extract user info from ID token
      this.userInfo = extractUserInfo(tokens.idToken);
      
      // Debug: Print JWT to console
      console.log('🎉 Authentication successful!');
      console.log('📋 ID Token:', tokens.idToken);
      console.log('🔑 Access Token:', tokens.accessToken);
      console.log('👤 User Info:', this.userInfo);
      console.log('⏰ Token expires at:', new Date(tokens.expiresAt).toLocaleString());
      
      // Save to storage
      this.saveToStorage();
      
      // Clean up URL (remove tokens from hash)
      window.history.replaceState(null, '', window.location.pathname);
      
      return true;
    } catch (error) {
      console.error('Error handling callback:', error);
      return false;
    }
  }
  
  /**
   * Logout - clear tokens and redirect to Cognito logout
   */
  logout() {
    try {
      this.clearSession();
      
      // Redirect to Cognito logout URL
      const logoutUrl = buildCognitoHostedUIUrl('logout');
      console.log('👋 Logging out...');
      window.location.href = logoutUrl;
    } catch (error) {
      console.error('Error during logout:', error);
      // Clear session anyway
      this.clearSession();
      window.location.href = '/';
    }
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    if (!this.tokens || !this.tokens.idToken) {
      return false;
    }
    
    // Check if token is expired
    if (this.tokens.expiresAt && this.tokens.expiresAt < Date.now()) {
      console.warn('Token expired');
      this.clearSession();
      return false;
    }
    
    return true;
  }
  
  /**
   * Get current user info
   */
  getCurrentUser() {
    return this.userInfo;
  }
  
  /**
   * Get ID token (JWT)
   */
  getIdToken() {
    return this.tokens?.idToken || null;
  }
  
  /**
   * Get access token
   */
  getAccessToken() {
    return this.tokens?.accessToken || null;
  }
  
  /**
   * Get authorization header value for API calls
   */
  getAuthHeader() {
    const token = this.getIdToken();
    return token ? `Bearer ${token}` : null;
  }
  
  /**
   * Decode current ID token
   */
  decodeIdToken() {
    const token = this.getIdToken();
    return token ? decodeJWT(token) : null;
  }
}

// Export singleton instance
export const cognitoAuth = new CognitoAuthService();

// Export class for testing
export { CognitoAuthService };

// Export utility functions
export { decodeJWT, extractUserInfo };

