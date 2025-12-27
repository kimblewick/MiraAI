import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, User, Menu, X, Trash2, Pencil, Check, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '../../utils';
import { Link } from 'react-router-dom';
import { cognitoAuth } from '@/services/cognitoAuth';
import { MiraLogo, CelestialDivider } from '@/components/ui/celestial-icons';

export default function ChatSidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onUpdateTitle,
  user,
  isOpen,
  onToggle
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleLogout = () => {
    cognitoAuth.logout();
  };

  const handleDelete = (e, conversationId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation?.(conversationId);
    }
  };

  const handleStartEdit = (e, conversation) => {
    e.stopPropagation();
    setEditingId(conversation.conversation_id);
    setEditValue(conversation.title || 'New Chat');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveEdit = async (e) => {
    e?.stopPropagation();
    
    if (!editValue.trim() || !editingId) {
      handleCancelEdit();
      return;
    }

    setIsSaving(true);
    const success = await onUpdateTitle?.(editingId, editValue.trim());
    setIsSaving(false);

    if (success) {
      handleCancelEdit();
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm border border-border hover:bg-secondary text-foreground"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: isOpen || window.innerWidth >= 1024 ? 0 : -320 }}
        className={cn(
          'w-80 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col',
          'fixed lg:relative inset-y-0 left-0 z-40'
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3 mb-5">
            <MiraLogo size={28} className="text-foreground" />
            <h1 className="font-display text-xl text-foreground tracking-wide">
              MIRA
            </h1>
          </div>
          <Button
            onClick={onNewChat}
            className="w-full bg-foreground text-background hover:bg-foreground/90 h-10 gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {(!conversations || conversations.length === 0) ? (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground/60 text-sm">No conversations yet</p>
              <p className="text-muted-foreground/40 text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {(Array.isArray(conversations) ? conversations : []).map((conversation, index) => {
                const isActive = currentConversation?.conversation_id === conversation.conversation_id;
                const isEditing = editingId === conversation.conversation_id;
                
                return (
                  <motion.div
                    key={conversation.conversation_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={cn(
                      'group relative w-full text-left p-3 rounded-lg transition-all cursor-pointer',
                      'hover:bg-secondary/50',
                      isActive
                        ? 'bg-secondary border border-border'
                        : 'border border-transparent'
                    )}
                    onClick={() => !isEditing && onSelectConversation(conversation)}
                  >
                    <div className="flex items-center gap-2.5 pr-14">
                      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          onBlur={handleSaveEdit}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isSaving}
                          className={cn(
                            'flex-1 text-sm text-foreground bg-background border border-border rounded px-2 py-1',
                            'focus:outline-none focus:ring-1 focus:ring-celestial focus:border-celestial',
                            isSaving && 'opacity-50'
                          )}
                          maxLength={100}
                        />
                      ) : (
                        <span className="text-sm text-foreground truncate">
                          {conversation.title || 'New Chat'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 ml-6.5">
                      <span className="text-xs text-muted-foreground/60">
                        {formatDate(conversation.updated_at || conversation.created_at)}
                      </span>
                      {conversation.message_count > 0 && (
                        <span className="text-xs text-muted-foreground/40">
                          {conversation.message_count} msg{conversation.message_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    {!isEditing && (
                      <div className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5',
                        'opacity-0 group-hover:opacity-100 transition-opacity'
                      )}>
                        {/* Edit button */}
                        {onUpdateTitle && (
                          <button
                            onClick={(e) => handleStartEdit(e, conversation)}
                            className={cn(
                              'p-1.5 rounded',
                              'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                            title="Edit title"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Delete button */}
                        {onDeleteConversation && (
                          <button
                            onClick={(e) => handleDelete(e, conversation.conversation_id)}
                            className={cn(
                              'p-1.5 rounded',
                              'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                            )}
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Save indicator when editing */}
                    {isEditing && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className={cn(
                            'p-1.5 rounded',
                            'text-celestial hover:bg-celestial/10'
                          )}
                          title="Save (Enter)"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <Link to={createPageUrl('Profile')}>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all">
              <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="text-sm font-medium text-foreground truncate">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user?.user_email || user?.email}
                </div>
              </div>
            </button>
          </Link>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full mt-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 gap-2 justify-start"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </>
  );
}
