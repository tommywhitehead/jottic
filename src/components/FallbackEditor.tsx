import React, { useRef, useEffect, useCallback, useState } from 'react';

interface FallbackEditorProps {
  documentTitle: string;
  onSave?: (content: string) => void;
  initialContent?: string;
  onTypingChange?: (isTyping: boolean) => void;
}

export function FallbackEditor({ 
  documentTitle, 
  onSave, 
  initialContent = '', 
  onTypingChange 
}: FallbackEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize content when component mounts
  useEffect(() => {
    if (initialContent && !isInitialized) {
      setContent(initialContent);
      setIsInitialized(true);
    }
  }, [initialContent, isInitialized]);

  // Handle text changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setContent(newText);
    
    // Notify parent about typing state
    if (onTypingChange) {
      onTypingChange(newText.length > 0);
    }
    
    // Call the onSave callback for Supabase integration
    if (onSave) {
      onSave(newText);
    }
  }, [onSave, onTypingChange]);

  // Handle key down for tab support
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tab at cursor position
      const newText = content.substring(0, start) + '\t' + content.substring(end);
      setContent(newText);
      
      // Set cursor position after the tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  }, [content]);

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
      {/* Text editor */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        className="editor-textarea"
        placeholder="Start typing..."
      />
      
      {/* Collaboration notice */}
      <div className="collaboration-notice">
        <p>💡 <strong>Collaborative editing coming soon!</strong> For now, you can edit and save your notes. Real-time collaboration with live cursors will be available once Liveblocks is fully configured.</p>
      </div>
    </div>
  );
}
