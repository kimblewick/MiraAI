/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the React app.
 * Manages user session, login/logout, and protected routes.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cognitoAuth } from '../services/cognitoAuth';

// Create context
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  /**
   * Check authentication status on mount and after storage changes
   */
  useEffect(() => {
    checkAuthStatus();
    
    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'cognito_tokens' || e.key === 'cognito_user_info') {
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  /**
   * Check if user is authenticated
   */
  const checkAuthStatus = () => {
    try {
      const authenticated = cognitoAuth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userInfo = cognitoAuth.getCurrentUser();
        setUser(userInfo);
        console.log('✅ User is authenticated:', userInfo);
      } else {
        setUser(null);
        console.log('🔒 User is not authenticated');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Login - redirect to Cognito Hosted UI
   */
  const login = () => {
    try {
      cognitoAuth.login();
    } catch (error) {
      console.error('Error during login:', error);
      alert('Failed to initiate login. Please check your Cognito configuration.');
    }
  };
  
  /**
   * Signup - redirect to Cognito Hosted UI
   */
  const signup = () => {
    try {
      cognitoAuth.signup();
    } catch (error) {
      console.error('Error during signup:', error);
      alert('Failed to initiate signup. Please check your Cognito configuration.');
    }
  };
  
  /**
   * Logout - clear session and redirect
   */
  const logout = () => {
    try {
      cognitoAuth.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Clear local state anyway
      setIsAuthenticated(false);
      setUser(null);
    }
  };
  
  /**
   * Handle OAuth callback
   */
  const handleCallback = () => {
    try {
      const success = cognitoAuth.handleCallback();
      
      if (success) {
        // Update state
        checkAuthStatus();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error handling callback:', error);
      return false;
    }
  };
  
  /**
   * Get ID token for API calls
   */
  const getIdToken = () => {
    return cognitoAuth.getIdToken();
  };
  
  /**
   * Get access token for API calls
   */
  const getAccessToken = () => {
    return cognitoAuth.getAccessToken();
  };
  
  /**
   * Get authorization header value
   */
  const getAuthHeader = () => {
    return cognitoAuth.getAuthHeader();
  };
  
  // Context value
  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    signup,
    logout,
    handleCallback,
    getIdToken,
    getAccessToken,
    getAuthHeader,
    checkAuthStatus,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * HOC to require authentication for a component
 */
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-purple-200">Loading...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      // Redirect to landing page
      window.location.href = '/';
      return null;
    }
    
    return <Component {...props} />;
  };
}

export default AuthContext;

