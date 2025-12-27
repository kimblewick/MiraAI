import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, Loader2, ArrowUp } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { CrescentMoon, StarField, SparkleIcon, ZodiacWheel } from '@/components/ui/celestial-icons';

export default function ChatArea({ 
  conversation, 
  messages, 
  onNewChat, 
  onSendMessage,
  isLoading,
  onToggleSidebar 
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Suggested questions for new chat
  const suggestedQuestions = [
    "What does my birth chart reveal about my personality?",
    "How does today's planetary alignment affect me?",
    "What's my compatibility with other signs?",
  ];

  // When there's no conversation, show welcome screen
  if (!conversation && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-border flex items-center justify-between">
          <Button
            onClick={onToggleSidebar}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary lg:hidden"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          <h2 className="font-display text-lg text-foreground">MIRA</h2>
          <div className="w-10 lg:hidden" />
        </header>
        
        {/* Welcome content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 relative">
          <StarField count={20} className="opacity-20" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 relative z-10"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-celestial/10 blur-2xl scale-150" />
              <div className="relative p-5 rounded-full border border-border bg-card/50">
                <CrescentMoon size={40} className="text-celestial" />
              </div>
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
              Start a New Journey
            </h2>
            <p className="text-muted-foreground max-w-md text-sm md:text-base">
              Ask about your birth chart, compatibility, daily guidance, or any astrological insights.
            </p>
          </motion.div>
          
          {/* Suggested questions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-xl space-y-2 mb-8 relative z-10"
          >
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="w-full text-left p-4 rounded-xl bg-card/50 border border-border hover:bg-secondary/50 hover:border-border transition-all text-sm text-muted-foreground hover:text-foreground"
              >
                {question}
              </button>
            ))}
          </motion.div>
          
          {/* Quick start input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-xl relative z-10"
          >
            <div className="bg-card rounded-2xl p-4 border border-border shadow-lg">
              <div className="flex gap-3 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask MIRA anything about astrology..."
                  className="flex-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 resize-none min-h-[52px] max-h-[200px] focus:ring-1 focus:ring-celestial/30"
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
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with chat history icon */}
      <header className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <Button
          onClick={onToggleSidebar}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-secondary lg:hidden"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
        <h2 className="font-display text-lg text-foreground truncate px-4 max-w-[60%]">
          {conversation?.title || 'MIRA'}
        </h2>
        <div className="w-10 lg:hidden" />
      </header>
      
      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <ZodiacWheel size={48} className="text-muted-foreground/30 mb-4" />
            <h2 className="font-display text-xl text-foreground mb-2">
              What would you like to explore?
            </h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Ask about your birth chart, compatibility, daily guidance, or any astrological insights.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <MessageBubble 
                key={`${message.timestamp}-${index}`} 
                message={message}
                isPending={message._pending}
              />
            ))}
            
            {/* Loading indicator for AI response */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <CrescentMoon size={16} className="text-celestial" />
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-celestial animate-spin" />
                    <span className="text-muted-foreground text-sm">MIRA is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 md:p-6 border-t border-border bg-card/30 backdrop-blur-sm shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask MIRA anything about astrology..."
              className="flex-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 resize-none min-h-[52px] max-h-[200px] focus:ring-1 focus:ring-celestial/30"
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
          <p className="text-xs text-muted-foreground/50 mt-2 text-center">
            MIRA can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}
