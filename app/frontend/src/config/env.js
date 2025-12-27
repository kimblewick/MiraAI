/**
 * Environment Configuration
 * 
 * Centralized access to environment variables with validation and defaults.
 * All environment variables must be prefixed with VITE_ to be accessible.
 */

/**
 * Get an environment variable with optional default value
 * @param {string} key - Environment variable key (without VITE_ prefix)
 * @param {string} defaultValue - Default value if not set
 * @param {boolean} required - Whether this variable is required
 * @returns {string}
 */
const getEnvVar = (key, defaultValue = '', required = false) => {
  const value = import.meta.env[`VITE_${key}`] || defaultValue;
  
  if (required && !value) {
    console.error(`Missing required environment variable: VITE_${key}`);
    console.warn(`Please check your .env file. See ENV_SETUP.md for configuration instructions.`);
  }
  
  return value;
};

/**
 * Get a boolean environment variable
 * @param {string} key - Environment variable key (without VITE_ prefix)
 * @param {boolean} defaultValue - Default value if not set
 * @returns {boolean}
 */
const getBoolEnvVar = (key, defaultValue = false) => {
  const value = import.meta.env[`VITE_${key}`];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1' || value === true;
};

/**
 * Environment configuration object
 */
export const config = {
  // API Configuration
  api: {
    baseUrl: getEnvVar('API_BASE_URL', 'http://localhost:3000/api', false),
    websocketUrl: getEnvVar('WEBSOCKET_URL', ''),
  },
  
  // AWS Configuration
  aws: {
    region: getEnvVar('AWS_REGION', 'us-east-1', false),
    cognito: {
      userPoolId: getEnvVar('AWS_COGNITO_USER_POOL_ID', ''),
      clientId: getEnvVar('AWS_COGNITO_CLIENT_ID', ''),
      identityPoolId: getEnvVar('AWS_COGNITO_IDENTITY_POOL_ID', ''),
      domain: getEnvVar('AWS_COGNITO_DOMAIN', ''),
    },
  },
  
  // Cognito OAuth Configuration
  cognito: {
    callbackUrl: getEnvVar('COGNITO_CALLBACK_URL', 
      typeof window !== 'undefined' ? `${window.location.origin}/callback` : 'http://localhost:5173/callback'
    ),
    logoutUrl: getEnvVar('COGNITO_LOGOUT_URL',
      typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:5173/'
    ),
  },
  
  // Application Configuration
  app: {
    env: getEnvVar('APP_ENV', 'development'),
    version: getEnvVar('APP_VERSION', '1.0.0'),
    debug: getBoolEnvVar('DEBUG_MODE', false),
  },
  
  // Feature Flags
  features: {
    chat: getBoolEnvVar('FEATURE_CHAT', true),
    profile: getBoolEnvVar('FEATURE_PROFILE', true),
    visualizations: getBoolEnvVar('FEATURE_VISUALIZATIONS', true),
  },
  
  // Environment checks
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

/**
 * Validate that all required environment variables are set
 * Call this during app initialization to fail fast if configuration is missing
 */
export const validateConfig = () => {
  const errors = [];
  
  // Check API URL
  if (!config.api.baseUrl) {
    errors.push('VITE_API_BASE_URL is not configured');
  }
  
  // Only validate AWS config if not in development mode
  if (config.app.env !== 'development' || config.isProduction) {
    if (!config.aws.cognito.userPoolId) {
      errors.push('VITE_AWS_COGNITO_USER_POOL_ID is not configured');
    }
    if (!config.aws.cognito.clientId) {
      errors.push('VITE_AWS_COGNITO_CLIENT_ID is not configured');
    }
    if (!config.aws.region) {
      errors.push('VITE_AWS_REGION is not configured');
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.warn('📖 See ENV_SETUP.md for configuration instructions');
    
    if (config.isProduction) {
      throw new Error('Missing required environment variables. Check console for details.');
    }
  }
  
  return errors.length === 0;
};

/**
 * Log current configuration (for debugging)
 * Careful not to log sensitive values in production
 */
export const logConfig = () => {
  if (!config.app.debug && config.isProduction) {
    return;
  }
  
  console.log('🔧 Environment Configuration:');
  console.log('  Environment:', config.app.env);
  console.log('  Mode:', config.mode);
  console.log('  Version:', config.app.version);
  console.log('  API Base URL:', config.api.baseUrl);
  console.log('  AWS Region:', config.aws.region);
  console.log('  Cognito User Pool:', config.aws.cognito.userPoolId ? '✓ Configured' : '✗ Not configured');
  console.log('  Cognito Client ID:', config.aws.cognito.clientId ? '✓ Configured' : '✗ Not configured');
  console.log('  WebSocket URL:', config.api.websocketUrl || 'Not configured');
  console.log('  Features:', {
    chat: config.features.chat,
    profile: config.features.profile,
    visualizations: config.features.visualizations,
  });
};

// Default export
export default config;

