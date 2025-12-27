import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/apiClient';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2 } from 'lucide-react';
import MessageBubble from '../components/chat/MessageBubble';
import { 
  StarField, 
  GradientOrb, 
  CrescentMoon,
  OrbitRings,
  MiraLogo,
  SparkleIcon
} from '@/components/ui/celestial-icons';

export default function FirstChat() {
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await apiClient.auth.me();

        // Check if user has profile
        const profiles = await apiClient.entities.UserProfile.filter({
          user_email: currentUser.email
        });

        if (profiles.length === 0) {
          window.location.href = createPageUrl('Onboarding');
          return;
        }

        setUser(profiles[0]); // Use profile instead of auth user

        // Create a new conversation
        const newConversation = await apiClient.agents.createConversation({
          agent_name: 'mira',
          metadata: { name: 'First Chat with MIRA' }
        });
        setConversation(newConversation);
      } catch (error) {
        console.log('Backend not available - using mock data for development');
        // If backend is not ready, use mock data for development
        const devProfile = localStorage.getItem('dev_profile');
        if (devProfile) {
          setUser(JSON.parse(devProfile));
        } else {
          setUser({ first_name: 'User', user_email: 'user@example.com' });
        }
        // Create mock conversation
        setConversation({ 
          id: 'dev-conversation-1', 
          agent_name: 'mira',
          messages: []
        });
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (conversation) {
      const unsubscribe = apiClient.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsubscribe();
    }
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !conversation || isLoading) return;

    const userMessage = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      await apiClient.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });

      // After first message, redirect to main chat
      setTimeout(() => {
        window.location.href = createPageUrl('Chat') + '?conversation=' + conversation.id;
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      console.log('Backend not available - message will be sent once backend is ready');
      // For development without backend, show a mock response
      alert('Backend not connected yet!\n\nYour message: "' + userMessage + '"\n\nConnect your AWS backend to get AI responses.\nSee API_DOCUMENTATION.md for details.');
      setIsLoading(false);
      // Still redirect to chat page for development
      setTimeout(() => {
        window.location.href = createPageUrl('Chat') + '?conversation=' + conversation.id;
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
      <StarField count={30} className="opacity-30" />
      <GradientOrb className="top-[-200px] left-[-200px]" size={500} />
      <GradientOrb className="bottom-[-200px] right-[-200px]" size={450} />
      
      {/* Decorative orbit rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <OrbitRings size={700} className="text-foreground animate-orbit-slow" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full px-6 md:px-12 py-6">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <MiraLogo size={32} className="text-foreground" />
            <span className="font-display text-lg tracking-wide text-foreground">MIRA</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-12">
          {/* Welcome message */}
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <div className="flex items-center justify-center gap-3 mb-5">
                <CrescentMoon size={36} className="text-celestial" />
                <h1 className="font-display text-4xl md:text-5xl text-foreground">
                  Hello, {user?.first_name}
                </h1>
                <SparkleIcon size={36} className="text-celestial" />
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                I'm MIRA, your cosmic companion. Ask me anything about astrology,
                your birth chart, compatibility, or seek guidance from the stars.
              </p>
            </motion.div>
          )}

          {/* Chat container */}
          <div className="w-full max-w-2xl flex flex-col justify-center">
            {/* Messages */}
            {messages.length > 0 && (
              <div className="flex-1 overflow-y-auto mb-6 space-y-4 px-4">
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input area */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full bg-card rounded-2xl p-4 border border-border shadow-lg"
            >
              <div className="flex gap-3 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your cosmic journey..."
                  className="flex-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 resize-none min-h-[80px] max-h-[200px] focus:ring-1 focus:ring-celestial/30"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-foreground text-background hover:bg-foreground/90 h-[52px] w-[52px] rounded-xl shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
