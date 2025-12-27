import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrescentMoon } from '@/components/ui/celestial-icons';

/**
 * Fix malformed inline markdown tables by inserting proper newlines
 * Handles cases where LLM outputs tables all on one line like:
 * "| Header | Header | |---|---| | Cell | Cell | | Cell | Cell |"
 * 
 * Converts to properly formatted:
 * | Header | Header |
 * |---|---|
 * | Cell | Cell |
 * | Cell | Cell |
 */
function fixMalformedTables(text) {
  if (!text) return '';
  
  let result = text;
  
  // Step 1: Add newline before separator rows (|---|---|)
  // Matches: "| content | |---" and adds newline before the separator
  result = result.replace(/\|\s*(\|[-:]+[-:\s|]+\|)/g, '|\n$1');
  
  // Step 2: Add newline after separator rows  
  // Matches: "---|---| |" (separator followed by content) and adds newline
  result = result.replace(/([-:]+\|)\s*\|\s*(?=[A-Za-z0-9])/g, '$1\n| ');
  
  // Step 3: Fix row boundaries - when we have "| content | | content" (end of row, start of new row)
  // This catches: "stretch. | | Feeling" pattern
  result = result.replace(/\|\s*\|\s*(?=[A-Za-z])/g, '|\n| ');
  
  return result;
}

/**
 * Error message shown when LLM runs out of tokens before generating an answer
 */
const TOKEN_LIMIT_ERROR_MESSAGE = `**Your question was too complex for me to fully answer.**

I ran out of processing capacity while thinking through your request. This happens with very detailed or multi-part questions.

**Try one of these:**
- Break your question into smaller, focused parts
- Ask about one specific topic at a time
- Simplify your request

For example, instead of asking about everything at once, try: *"What does my Sun sign say about my career?"*`;

/**
 * Filter AI response to remove reasoning/thinking tags and only show user-facing content
 * Handles patterns like <reasoning>...</reasoning> or <thinking>...</thinking>
 * 
 * If the LLM used all tokens for reasoning and produced no answer, returns an error message
 */
function filterAIResponse(response) {
  if (!response) return '';
  
  // Check if the response contains reasoning/thinking tags (to detect token limit issue later)
  const hadReasoningTags = /<(reasoning|thinking)>/i.test(response);
  
  let filtered = response;
  
  // Remove <reasoning>...</reasoning> blocks
  filtered = filtered.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  
  // Remove <thinking>...</thinking> blocks
  filtered = filtered.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  
  // Remove any orphaned opening/closing tags
  filtered = filtered.replace(/<\/?reasoning>/gi, '');
  filtered = filtered.replace(/<\/?thinking>/gi, '');
  
  // Remove <answer> tags but keep content
  filtered = filtered.replace(/<answer>/gi, '');
  filtered = filtered.replace(/<\/answer>/gi, '');
  
  // Fix malformed inline tables
  filtered = fixMalformedTables(filtered);
  
  // Clean up excessive whitespace
  filtered = filtered.replace(/\n{3,}/g, '\n\n');
  
  const trimmedResult = filtered.trim();
  
  // If the original response had reasoning tags but after filtering we have no content,
  // it means the LLM used all tokens for reasoning and ran out before generating an answer
  if (!trimmedResult && hadReasoningTags) {
    return TOKEN_LIMIT_ERROR_MESSAGE;
  }
  
  return trimmedResult;
}

/**
 * Single message bubble component - handles both user and AI messages
 * Backend returns messages in format: { user_message, ai_response, chart_url?, timestamp }
 */
export default function MessageBubble({ message, isPending = false }) {
  // Handle the backend's message format where each entry contains both user and AI message
  const { user_message, ai_response, chart_url, timestamp, created_at } = message;
  
  // Filter AI response to remove internal reasoning
  const filteredResponse = filterAIResponse(ai_response);
  const isError = filteredResponse === TOKEN_LIMIT_ERROR_MESSAGE;
  
  return (
    <div className="space-y-4">
      {/* User message */}
      {user_message && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-end"
        >
          <div className="max-w-[85%] flex flex-col items-end">
            <div className="rounded-2xl px-4 py-3 bg-foreground text-background">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{user_message}</p>
            </div>
            {created_at && (
              <span className="text-xs text-muted-foreground/40 mt-1.5">
                {new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>
      )}
      
      {/* AI response */}
      {(filteredResponse || isPending) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-start"
        >
          <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center mt-0.5 flex-shrink-0">
            <CrescentMoon size={16} className="text-celestial" />
          </div>
          <div className="max-w-[85%]">
            {isPending ? (
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-celestial animate-spin" />
                  <span className="text-muted-foreground text-sm">Sending...</span>
                </div>
              </div>
            ) : (
              <div className={cn(
                "rounded-2xl px-4 py-3 bg-card border",
                isError ? "border-destructive/30 bg-destructive/5" : "border-border"
              )}>
                {isError && (
                  <div className="flex items-center gap-2 mb-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Response limit reached</span>
                  </div>
                )}
                <ReactMarkdown
                  className="text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="my-2 leading-relaxed text-foreground">{children}</p>,
                    ul: ({ children }) => <ul className="my-2 ml-4 list-disc text-foreground">{children}</ul>,
                    ol: ({ children }) => <ol className="my-2 ml-4 list-decimal text-foreground">{children}</ol>,
                    li: ({ children }) => <li className="my-1 text-foreground">{children}</li>,
                    h1: ({ children }) => <h1 className="font-display text-lg font-medium my-3 text-foreground">{children}</h1>,
                    h2: ({ children }) => <h2 className="font-display text-base font-medium my-3 text-foreground">{children}</h2>,
                    h3: ({ children }) => <h3 className="font-display text-sm font-medium my-2 text-foreground">{children}</h3>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-celestial/50 pl-3 my-3 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-xs font-mono">{children}</code>
                      ) : (
                        <code className="block bg-secondary rounded-lg p-3 text-xs text-foreground my-2 overflow-x-auto font-mono">{children}</code>
                      ),
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-celestial hover:underline"
                      >
                        {children}
                      </a>
                    ),
                    // Table components for GFM table support
                    table: ({ children }) => (
                      <div className="my-3 overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-secondary text-foreground font-medium">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-border">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-secondary/50 transition-colors">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-foreground font-medium border-b border-border">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 text-foreground">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {filteredResponse}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
