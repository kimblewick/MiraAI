import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/api/apiClient';
import { cognitoAuth } from '@/services/cognitoAuth';
import { createPageUrl } from '../utils';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatArea from '../components/chat/ChatArea';
import VisualizationArea from '../components/chat/VisualizationArea';
import { motion } from 'framer-motion';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartUrl, setChartUrl] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  /**
   * Check if cached profile belongs to current user and is valid
   */
  const isValidCachedProfile = () => {
    try {
      const cachedProfile = localStorage.getItem('user_profile');
      const profileCheckTime = localStorage.getItem('profile_check_time');
      const cachedUserId = localStorage.getItem('profile_user_id');
      const currentUser = cognitoAuth.getCurrentUser();
      
      if (!cachedProfile || !profileCheckTime) return null;
      
      // Check if cache belongs to current user
      if (cachedUserId && currentUser?.sub && cachedUserId !== currentUser.sub) {
        console.log('Cache belongs to different user - need fresh profile');
        return null;
      }
      
      // Check if cache is still valid (5 minutes)
      const fiveMinutes = 5 * 60 * 1000;
      const timeSinceCheck = Date.now() - parseInt(profileCheckTime);
      if (timeSinceCheck >= fiveMinutes) {
        console.log('Cache expired');
        return null;
      }
      
      const profile = JSON.parse(cachedProfile);
      if (profile?.birth_date) {
        return profile;
      }
      
      return null;
    } catch (e) {
      console.error('Error checking cached profile:', e);
      return null;
    }
  };
  
  /**
   * Clear profile cache
   */
  const clearProfileCache = () => {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('profile_check_time');
    localStorage.removeItem('profile_user_id');
  };
  
  /**
   * Cache user profile with user ID
   */
  const cacheUserProfile = (profile) => {
    const currentUser = cognitoAuth.getCurrentUser();
    localStorage.setItem('user_profile', JSON.stringify(profile));
    localStorage.setItem('profile_check_time', Date.now().toString());
    localStorage.setItem('profile_user_id', currentUser?.sub || '');
  };

  /**
   * Load conversations from backend
   */
  const loadConversations = useCallback(async () => {
    try {
      const convos = await apiClient.conversations.list();
      setConversations(convos || []);
      return convos || [];
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
      return [];
    }
  }, []);

  /**
   * Load messages for a conversation
   */
  const loadConversationMessages = useCallback(async (conversationId) => {
    try {
      const result = await apiClient.conversations.getMessages(conversationId);
      const msgs = result.messages || [];
      setMessages(msgs);
      
      // Set the latest chart URL if available
      const latestChartUrl = msgs.reduce((url, msg) => msg.chart_url || url, null);
      if (latestChartUrl) {
        setChartUrl(latestChartUrl);
      }
      
      return msgs;
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
      return [];
    }
  }, []);

  useEffect(() => {
    // First check if user is authenticated
    if (!cognitoAuth.isAuthenticated()) {
      console.warn('User not authenticated, redirecting to login');
      window.location.href = '/';
      return;
    }

    const init = async () => {
      try {
        // First check localStorage cache for faster initial load
        let userProfile = isValidCachedProfile();
        
        if (userProfile) {
          console.log('Using cached profile for Chat');
        }
        
        // If no valid cache, try to fetch from API
        if (!userProfile) {
          try {
            console.log('Fetching profile from API...');
            userProfile = await apiClient.profile.get();
            
            if (userProfile && userProfile.birth_date) {
              // Cache the profile with user ID
              cacheUserProfile(userProfile);
              console.log('Profile fetched and cached');
            }
          } catch (profileError) {
            // 404 means no profile - redirect to onboarding
            if (profileError.status === 404) {
              console.log('No profile found (404) - redirecting to onboarding');
              clearProfileCache();
              window.location.href = createPageUrl('Onboarding');
              return;
            }
            // 500 or other errors - if we have no valid cache, redirect to onboarding
            console.warn('Could not fetch profile:', profileError);
            clearProfileCache();
            console.log('Redirecting to onboarding to verify/create profile');
            window.location.href = createPageUrl('Onboarding');
            return;
          }
        }
        
        // If still no profile, redirect to onboarding
        if (!userProfile || !userProfile.birth_date) {
          console.log('No valid profile - redirecting to onboarding');
          clearProfileCache();
          window.location.href = createPageUrl('Onboarding');
          return;
        }

        setUser(userProfile);

        // Load conversations
        const convos = await loadConversations();

        // Check for conversation ID in URL
        const urlParams = new URLSearchParams(window.location.search);
        const conversationId = urlParams.get('conversation');

        if (conversationId) {
          // Load specific conversation from URL
          const msgs = await loadConversationMessages(conversationId);
          const convo = convos.find(c => c.conversation_id === conversationId);
          if (convo) {
            setCurrentConversation(convo);
          } else {
            // Conversation exists but not in list (might be new)
            setCurrentConversation({ conversation_id: conversationId });
          }
        } else if (convos.length > 0) {
          // Load the most recent conversation
          const latest = convos[0];
          setCurrentConversation(latest);
          await loadConversationMessages(latest.conversation_id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        // If backend is not ready, try to use cached/local data for development
        const cachedProfile = localStorage.getItem('user_profile');
        if (cachedProfile) {
          try {
            setUser(JSON.parse(cachedProfile));
          } catch (e) {
            setUser({ first_name: 'User', user_email: 'user@example.com' });
          }
        } else {
          setUser({ first_name: 'User', user_email: 'user@example.com' });
        }
        
        setConversations([]);
        setLoading(false);
      }
    };
    init();
  }, [loadConversations, loadConversationMessages]);

  /**
   * Handle sending a new message
   */
  const handleSendMessage = async (message) => {
    if (!message.trim() || sendingMessage) return;

    setSendingMessage(true);
    
    // Optimistically add user message to UI
    const tempUserMessage = {
      user_message: message,
      ai_response: null,
      timestamp: Date.now() / 1000,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const conversationId = currentConversation?.conversation_id || null;
      const result = await apiClient.chat.sendMessage(message, conversationId);
      
      console.log('Chat response:', result);
      
      // Update the message with AI response
      const newMessage = {
        user_message: message,
        ai_response: result.message,
        chart_url: result.chart_url,
        timestamp: Date.now() / 1000,
        created_at: new Date().toISOString(),
      };
      
      // Replace the pending message with the complete one
      setMessages(prev => {
        const filtered = prev.filter(m => !m._pending);
        return [...filtered, newMessage];
      });
      
      // Update chart URL if provided
      if (result.chart_url) {
        setChartUrl(result.chart_url);
      }
      
      // Update conversation if this was a new one
      if (result.conversation_id && !conversationId) {
        const newConvo = {
          conversation_id: result.conversation_id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: 1,
        };
        setCurrentConversation(newConvo);
        
        // Refresh conversations list
        await loadConversations();
        
        // Update URL
        window.history.pushState({}, '', createPageUrl('Chat') + '?conversation=' + result.conversation_id);
      } else if (conversationId) {
        // Refresh the current conversation
        setCurrentConversation(prev => ({
          ...prev,
          message_count: (prev?.message_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the pending message on error
      setMessages(prev => prev.filter(m => !m._pending));
      
      // Show error to user
      alert('Failed to send message. Please try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleNewChat = async () => {
    // Clear current conversation and messages
    setCurrentConversation(null);
    setMessages([]);
    setChartUrl(null);
    
    // Clear URL
    window.history.pushState({}, '', createPageUrl('Chat'));
  };

  const handleSelectConversation = async (conversation) => {
    if (conversation.conversation_id === currentConversation?.conversation_id) {
      return; // Already selected
    }
    
    setCurrentConversation(conversation);
    setMessages([]);
    setChartUrl(null);
    
    // Load messages for selected conversation
    await loadConversationMessages(conversation.conversation_id);
    
    // Update URL
    window.history.pushState({}, '', createPageUrl('Chat') + '?conversation=' + conversation.conversation_id);
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await apiClient.conversations.delete(conversationId);
      
      // Refresh conversations list
      const convos = await loadConversations();
      
      // If we deleted the current conversation, clear it
      if (currentConversation?.conversation_id === conversationId) {
        if (convos.length > 0) {
          setCurrentConversation(convos[0]);
          await loadConversationMessages(convos[0].conversation_id);
          window.history.pushState({}, '', createPageUrl('Chat') + '?conversation=' + convos[0].conversation_id);
        } else {
          setCurrentConversation(null);
          setMessages([]);
          setChartUrl(null);
          window.history.pushState({}, '', createPageUrl('Chat'));
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleUpdateConversationTitle = async (conversationId, newTitle) => {
    try {
      await apiClient.conversations.updateTitle(conversationId, newTitle);
      
      // Update the conversation in state
      setConversations(prev => prev.map(conv => 
        conv.conversation_id === conversationId 
          ? { ...conv, title: newTitle, updated_at: new Date().toISOString() }
          : conv
      ));
      
      // Update current conversation if it's the one being edited
      if (currentConversation?.conversation_id === conversationId) {
        setCurrentConversation(prev => ({ ...prev, title: newTitle }));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      alert('Failed to update title. Please try again.');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-border border-t-celestial animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onUpdateTitle={handleUpdateConversationTitle}
        user={user}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex overflow-hidden">
        <ChatArea
          conversation={currentConversation}
          messages={messages}
          onNewChat={handleNewChat}
          onSendMessage={handleSendMessage}
          isLoading={sendingMessage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Visualization area */}
        <VisualizationArea chartUrl={chartUrl} />
      </div>
    </div>
  );
}
