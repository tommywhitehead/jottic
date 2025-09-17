import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  useMyPresence, 
  useOthers, 
  useStorage, 
  useMutation 
} from '../lib/liveblocks';

interface SafeLiveblocksEditorProps {
  documentTitle: string;
  onSave?: (content: string) => void;
  initialContent?: string;
  onTypingChange?: (isTyping: boolean) => void;
  onError?: () => void;
}

export function SafeLiveblocksEditor({ 
  documentTitle, 
  onSave, 
  initialContent = '', 
  onTypingChange,
  onError
}: SafeLiveblocksEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const [isInitialized, setIsInitialized] = useState(false);
  const [liveblocksError, setLiveblocksError] = useState(false);

  // Try to use Liveblocks hooks with error handling
  let myPresence: any = null;
  let updateMyPresence: any = null;
  let others: any[] = [];
  let liveblocksContent: string = '';
  let updateContent: any = null;

  try {
    [myPresence, updateMyPresence] = useMyPresence();
    others = useOthers();
    liveblocksContent = useStorage((root) => root?.content || '');
    updateContent = useMutation(({ storage }, newContent: string) => {
      storage.set('content', newContent);
      storage.set('lastModified', Date.now());
    }, []);
  } catch (error) {
    console.warn('Liveblocks hooks failed, using fallback mode:', error);
    if (onError) onError();
    setLiveblocksError(true);
  }

  // Use Liveblocks content if available, otherwise use local state
  const currentContent = liveblocksError ? content : (liveblocksContent || content);

  // Initialize content when component mounts
  useEffect(() => {
    if (initialContent && !isInitialized) {
      if (updateContent && !liveblocksError) {
        try {
          updateContent(initialContent);
        } catch (error) {
          console.warn('Failed to initialize Liveblocks content:', error);
          setLiveblocksError(true);
        }
      } else {
        setContent(initialContent);
      }
      setIsInitialized(true);
    }
  }, [initialContent, isInitialized, updateContent, liveblocksError]);

  // Handle text changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    if (updateContent && !liveblocksError) {
      try {
        updateContent(newText);
      } catch (error) {
        console.warn('Liveblocks update failed, using local state:', error);
        setLiveblocksError(true);
        setContent(newText);
      }
    } else {
      setContent(newText);
    }
    
    // Notify parent about typing state
    if (onTypingChange) {
      onTypingChange(newText.length > 0);
    }
    
    // Call the onSave callback for Supabase integration
    if (onSave) {
      onSave(newText);
    }
  }, [updateContent, onSave, onTypingChange, liveblocksError]);

  // Handle cursor position changes
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current || !updateMyPresence || liveblocksError) return;
    
    try {
      const textarea = textareaRef.current;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      
      updateMyPresence({
        selection: {
          anchor: selectionStart,
          focus: selectionEnd,
        },
      });
    } catch (error) {
      console.warn('Liveblocks presence update failed:', error);
    }
  }, [updateMyPresence, liveblocksError]);

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current || !updateMyPresence || liveblocksError) return;
    
    try {
      const rect = textareaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      updateMyPresence({
        cursor: { x, y },
      });
    } catch (error) {
      console.warn('Liveblocks cursor update failed:', error);
    }
  }, [updateMyPresence, liveblocksError]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (!updateMyPresence || liveblocksError) return;
    
    try {
      updateMyPresence({
        cursor: null,
      });
    } catch (error) {
      console.warn('Liveblocks cursor clear failed:', error);
    }
  }, [updateMyPresence, liveblocksError]);

  // Handle key down for tab support
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = currentContent || '';
      
      // Insert tab at cursor position
      const newText = currentText.substring(0, start) + '\t' + currentText.substring(end);
      
      if (updateContent && !liveblocksError) {
        try {
          updateContent(newText);
        } catch (error) {
          console.warn('Liveblocks tab update failed:', error);
          setContent(newText);
        }
      } else {
        setContent(newText);
      }
      
      // Set cursor position after the tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  }, [currentContent, updateContent, liveblocksError]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentContent]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="collaborative-editor">
      {/* Live cursors overlay - only show if Liveblocks is working */}
      {!liveblocksError && others && others.length > 0 && (
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
      )}

      {/* Text editor */}
      <textarea
        ref={textareaRef}
        value={currentContent}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectionChange}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="editor-textarea"
        placeholder="Start typing..."
      />

      {/* User presence indicators - only show if Liveblocks is working */}
      {!liveblocksError && others && others.length > 0 && (
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
      )}

      {/* Collaboration status */}
      {liveblocksError && (
        <div className="collaboration-notice">
          <p>⚠️ <strong>Liveblocks disconnected</strong> - You're editing locally. Real-time collaboration is not available.</p>
        </div>
      )}
    </div>
  );
}
