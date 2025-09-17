import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  useMyPresence, 
  useOthers, 
  useStorage, 
  useMutation 
} from '../lib/liveblocks';

interface LiveblocksEditorProps {
  documentTitle: string;
  onSave?: (content: string) => void;
  initialContent?: string;
  onTypingChange?: (isTyping: boolean) => void;
  onError?: () => void;
}

export function LiveblocksEditor({ 
  documentTitle, 
  onSave, 
  initialContent = '', 
  onTypingChange,
  onError
}: LiveblocksEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const content = useStorage((root) => root?.content || '');
  const [isInitialized, setIsInitialized] = useState(false);

  // Mutation to update content
  const updateContent = useMutation(({ storage }, newContent: string) => {
    storage.set('content', newContent);
    storage.set('lastModified', Date.now());
  }, []);

  // Initialize content from Supabase if available
  const initializeContent = useMutation(({ storage }, initialContent: string) => {
    if (!storage.get('content') && initialContent) {
      storage.set('content', initialContent);
      storage.set('lastModified', Date.now());
    }
  }, []);

  // Initialize content when component mounts
  useEffect(() => {
    if (initialContent && !isInitialized) {
      try {
        initializeContent(initialContent);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Liveblocks content:', error);
        if (onError) onError();
      }
    }
  }, [initialContent, isInitialized, initializeContent, onError]);

  // Handle Liveblocks errors
  useEffect(() => {
    const handleError = (error: any) => {
      console.error('Liveblocks error:', error);
      if (onError) onError();
    };

    // Add error listeners if needed
    return () => {
      // Cleanup error listeners
    };
  }, [onError]);

  // Handle text changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    updateContent(newText);
    
    // Notify parent about typing state
    if (onTypingChange) {
      onTypingChange(newText.length > 0);
    }
    
    // Call the onSave callback for Supabase integration
    if (onSave) {
      onSave(newText);
    }
  }, [updateContent, onSave, onTypingChange]);

  // Handle cursor position changes
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    
    updateMyPresence({
      selection: {
        anchor: selectionStart,
        focus: selectionEnd,
      },
    });
  }, [updateMyPresence]);

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;
    
    const rect = textareaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    updateMyPresence({
      cursor: { x, y },
    });
  }, [updateMyPresence]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    updateMyPresence({
      cursor: null,
    });
  }, [updateMyPresence]);

  // Handle key down for tab support
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = content || '';
      
      // Insert tab at cursor position
      const newText = currentContent.substring(0, start) + '\t' + currentContent.substring(end);
      updateContent(newText);
      
      // Set cursor position after the tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  }, [content, updateContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="collaborative-editor">
      {/* Live cursors overlay */}
      <div className="cursors-overlay">
        {others.map(({ connectionId, presence }) => {
          if (!presence?.cursor) return null;
          
          return (
            <div
              key={connectionId}
              className="live-cursor"
              style={{
                left: presence.cursor.x,
                top: presence.cursor.y,
                backgroundColor: presence.user?.color || '#000',
              }}
            >
              <div className="cursor-pointer" />
              <div className="cursor-label">
                {presence.user?.name || 'Anonymous'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Text editor */}
      <textarea
        ref={textareaRef}
        value={content || ''}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectionChange}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="editor-textarea"
        placeholder="Start typing..."
      />

      {/* User presence indicators */}
      <div className="presence-indicators">
        {others.map(({ connectionId, presence }) => (
          <div
            key={connectionId}
            className="presence-indicator"
            style={{
              backgroundColor: presence?.user?.color || '#000',
            }}
            title={presence?.user?.name || 'Anonymous'}
          >
            {presence?.user?.name?.[0] || 'A'}
          </div>
        ))}
      </div>
    </div>
  );
}
