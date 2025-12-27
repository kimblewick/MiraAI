// API Client - Configured via environment variables
import config from '../config/env.js';
import { cognitoAuth } from '../services/cognitoAuth.js';

const BASE_URL = config.api.baseUrl;

class ApiClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  async request(endpoint, options = {}) {
    // Get token from Cognito auth service
    const authHeader = cognitoAuth.getAuthHeader();
    const headers = {
      'Content-Type': 'application/json',
      ...(authHeader && { Authorization: authHeader }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - clear session and redirect to login
          cognitoAuth.clearSession();
          window.location.href = '/';
          throw new Error('Unauthorized');
        }
        
        // For 404, return the error response body instead of throwing
        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({ error: 'Not found' }));
          const error = new Error('Not found');
          error.status = 404;
          error.data = errorData;
          throw error;
        }
        
        // For other errors, try to get error details from response
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        const error = new Error(JSON.stringify(errorData));
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    me: async () => {
      return this.request('/auth/me');
    },
    
    // Note: Login/signup now handled by Cognito Hosted UI
    // These methods are kept for backward compatibility but will use Cognito
    login: async () => {
      console.warn('Direct login deprecated - use Cognito Hosted UI via cognitoAuth.login()');
      cognitoAuth.login();
    },
    
    signup: async () => {
      console.warn('Direct signup deprecated - use Cognito Hosted UI via cognitoAuth.signup()');
      cognitoAuth.signup();
    },
    
    logout: () => {
      cognitoAuth.logout();
    },
    
    redirectToLogin: (returnUrl) => {
      if (returnUrl) {
        localStorage.setItem('return_url', returnUrl);
      }
      window.location.href = '/';
    },
  };

  // User Profile endpoints
  profile = {
    // Create a new user profile (POST /profile)
    // Backend returns: {"message": "...", "profile": {...}}
    create: async (data) => {
      const response = await this.request('/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return this._unwrapLambdaResponse(response);
    },
    
    // Get user profile (GET /profile)
    // Backend returns: {"profile": {...}} - we unwrap it for convenience
    // Note: Sometimes API Gateway returns raw Lambda format with statusCode/body
    get: async () => {
      const response = await this.request('/profile', {
        method: 'GET',
      });
      
      // Handle raw Lambda response format (statusCode + body as string)
      const unwrapped = this._unwrapLambdaResponse(response);
      
      // Unwrap the profile from the response
      return unwrapped.profile || unwrapped;
    },
    
    // Update user profile (POST /profile - backend uses put_item which replaces/upserts)
    update: async (data) => {
      const response = await this.request('/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return this._unwrapLambdaResponse(response);
    },
  };
  
  /**
   * Helper to unwrap raw Lambda response format.
   * Sometimes API Gateway returns: {"statusCode": 200, "body": "{...json string...}"}
   * This helper detects and parses such responses.
   */
  _unwrapLambdaResponse(response) {
    // Check if response is in raw Lambda format (has statusCode and body as string)
    if (response && typeof response.statusCode === 'number' && typeof response.body === 'string') {
      try {
        console.log('📦 Unwrapping raw Lambda response format');
        return JSON.parse(response.body);
      } catch (e) {
        console.warn('Failed to parse Lambda response body:', e);
        return response;
      }
    }
    return response;
  }

  // Chat endpoints - Main chat functionality
  chat = {
    /**
     * Send a message to the AI and get a response
     * POST /chat
     * @param {string} message - The user's message
     * @param {string|null} conversationId - Optional conversation ID to continue existing conversation
     * @returns {Promise<{message: string, chart_url: string, conversation_id: string}>}
     */
    sendMessage: async (message, conversationId = null) => {
      const body = { message };
      if (conversationId) {
        body.conversation_id = conversationId;
      }
      
      const response = await this.request('/chat', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      
      return this._unwrapLambdaResponse(response);
    },
  };

  // Conversation management endpoints
  conversations = {
    /**
     * List all conversations for the current user
     * GET /conversations
     * @returns {Promise<{conversations: Array, has_more: boolean}>}
     */
    list: async () => {
      const response = await this.request('/conversations', {
        method: 'GET',
      });
      const unwrapped = this._unwrapLambdaResponse(response);
      return unwrapped.conversations || [];
    },
    
    /**
     * Create a new conversation
     * POST /conversations
     * @param {string} title - Optional title for the conversation
     * @returns {Promise<{conversation_id: string, title: string, created_at: string, message_count: number}>}
     */
    create: async (title = '') => {
      const response = await this.request('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      return this._unwrapLambdaResponse(response);
    },
    
    /**
     * Get messages for a specific conversation
     * GET /conversations/{id}/messages
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<{conversation_id: string, messages: Array, has_more: boolean}>}
     */
    getMessages: async (conversationId) => {
      const response = await this.request(`/conversations/${conversationId}/messages`, {
        method: 'GET',
      });
      return this._unwrapLambdaResponse(response);
    },
    
    /**
     * Delete a conversation (soft delete)
     * DELETE /conversations/{id}
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<{message: string, conversation_id: string}>}
     */
    delete: async (conversationId) => {
      const response = await this.request(`/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      return this._unwrapLambdaResponse(response);
    },
    
    /**
     * Update conversation title
     * PATCH /conversations/{id}
     * @param {string} conversationId - The conversation ID
     * @param {string} title - New title
     * @returns {Promise<{conversation_id: string, title: string, updated_at: string}>}
     */
    updateTitle: async (conversationId, title) => {
      const response = await this.request(`/conversations/${conversationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      });
      return this._unwrapLambdaResponse(response);
    },
  };

  // Legacy User Profile endpoints (kept for backward compatibility)
  entities = {
    UserProfile: {
      filter: async (filters) => {
        const params = new URLSearchParams(filters);
        return this.request(`/profiles?${params}`);
      },
      
      create: async (data) => {
        return this.request('/profiles', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      
      update: async (id, data) => {
        return this.request(`/profiles/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
      
      delete: async (id) => {
        return this.request(`/profiles/${id}`, {
          method: 'DELETE',
        });
      },
    },
  };

  // Legacy agents endpoints (for backward compatibility with existing code)
  agents = {
    listConversations: async () => {
      return this.conversations.list();
    },
    
    getConversation: async (conversationId) => {
      return this.conversations.getMessages(conversationId);
    },
    
    createConversation: async ({ metadata }) => {
      const title = metadata?.name || 'New Chat';
      return this.conversations.create(title);
    },
    
    // This method is no longer used - we use chat.sendMessage instead
    addMessage: async (conversation, message) => {
      console.warn('agents.addMessage is deprecated. Use chat.sendMessage instead.');
      return this.chat.sendMessage(message.content, conversation?.id || conversation?.conversation_id);
    },
    
    // WebSocket subscription is not implemented in backend
    // Return a no-op function for compatibility
    subscribeToConversation: (conversationId, callback) => {
      console.log('Real-time subscription not implemented - using polling instead');
      return () => {}; // Return empty cleanup function
    },
  };
}

export const apiClient = new ApiClient();
