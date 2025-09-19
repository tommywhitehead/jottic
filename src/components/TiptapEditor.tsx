import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useLiveblocksExtension } from '@liveblocks/react-tiptap';
import StarterKit from '@tiptap/starter-kit';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { HardBreak } from '@tiptap/extension-hard-break';
import { useStorage, useMutation, useMyPresence, useUpdateMyPresence, useOthers } from '../lib/liveblocks';
import { NoteLinkExtension } from './NoteLinkExtension';
import { useNoteNavigation } from '../lib/noteNavigation';

// Helper function to convert hex color to hue rotation
function getHueFromColor(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Convert RGB to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max === min) {
    h = 0; // achromatic
  } else {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return Math.round(h * 360);
}

interface TiptapEditorProps {
  documentTitle: string;
  onSave?: (content: string) => void;
  initialContent?: string;
  onTypingChange?: (isTyping: boolean) => void;
  onError?: () => void;
  onUserCountChange?: (count: number) => void;
}

export function TiptapEditor({ 
  documentTitle, 
  onSave, 
  initialContent = '', 
  onTypingChange,
  onError,
  onUserCountChange
}: TiptapEditorProps) {
  const content = useStorage((root) => root?.content || '');
  
  // Debug: Log what content we're getting
  console.log('TiptapEditor props:', { documentTitle, initialContent, liveblocksContent: content });
  
  // Track if we've initialized content for this document
  const initializedRef = useRef<string | null>(null);
  
  // Cursor and presence management
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  
  // Note navigation functionality
  const { goToNote } = useNoteNavigation();

  // Set initial user information in presence (only once)
  useEffect(() => {
    if (!myPresence?.user) {
      // Force all guest colors to be light gray (ghost-like)
      updateMyPresence({
        user: {
          name: `User ${Date.now().toString().slice(-3)}`,
          color: '#CCCCCC' // Light gray for all guests
        }
      });
    }
  }, []); // Empty dependency array to run only once

  // Debug: Log user colors
  useEffect(() => {
    console.log('My presence:', myPresence);
    console.log('Others:', others.map(o => ({ name: o.presence?.user?.name, color: o.presence?.user?.color })));
  }, [myPresence, others]);
  
  // Mutation to update content - only call when storage is loaded
  const updateContent = useMutation(({ storage }, newContent: string) => {
    if (storage) {
      storage.set('content', newContent);
      storage.set('lastModified', Date.now());
    }
  }, []);

  // Safe wrapper for updateContent that checks if mutation is ready
  const safeUpdateContent = (newContent: string) => {
    // Only attempt mutation if we have content (storage is loaded)
    if (content === undefined) {
      return;
    }
    
    try {
      updateContent(newContent);
    } catch (error) {
      // Silently ignore storage not loaded errors
      if (!error.message?.includes('storage has been loaded')) {
        console.error('Failed to update Liveblocks content:', error);
      }
    }
  };

  // Check if storage is loaded
  const isStorageLoaded = content !== undefined;

  // Liveblocks extension for collaboration
  const liveblocks = useLiveblocksExtension({
    // Disable mention functionality completely
    mentions: false,
  });

  // Initialize Tiptap editor with working configuration
  const editor = useEditor({
    extensions: [
      // Use StarterKit for basic functionality with Liveblocks
      liveblocks,
      StarterKit.configure({
        // Disable all formatting features
        bold: false,
        italic: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        heading: false,
        // Keep only basic text editing
        history: false,
      }),
      // Add note link extension with auto-navigation
      NoteLinkExtension.configure({
        onLinkCreated: goToNote,
      }),
    ],
    content: initialContent || '', // Use initialContent directly, not Liveblocks content
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      
      // Only update content if storage is loaded
      if (isStorageLoaded) {
        safeUpdateContent(html);
      }
      
      // Notify parent about typing state
      if (onTypingChange) {
        onTypingChange(html.length > 0);
      }
      
      // Call the onSave callback for Supabase integration
      if (onSave) {
        onSave(html);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Handle selection changes for collaboration
      const { from, to } = editor.state.selection;
      updateMyPresence({
        selection: { anchor: from, focus: to }
      });
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        'data-placeholder': 'Start typing...',
      },
      handleKeyDown: (view, event) => {
        // Handle Tab key to insert tab character
        if (event.key === 'Tab') {
          event.preventDefault();
          const { state, dispatch } = view;
          const { tr } = state;
          const insertPos = state.selection.from;
          tr.insertText('\t', insertPos, insertPos);
          dispatch(tr);
          return true;
        }
        return false;
      },
    },
  }, [documentTitle]); // Force recreation only when document changes

  // Initialize content from Supabase to Liveblocks storage when document changes
  useEffect(() => {
    // Only initialize once per document title and when storage is loaded
    if (initialContent !== undefined && initializedRef.current !== documentTitle && isStorageLoaded) {
      const timer = setTimeout(() => {
        // Double-check that storage is still loaded before calling mutation
        if (content !== undefined) {
          // Always use initialContent from Supabase for consistency
          // This ensures new notes start blank and existing notes load their saved content
          safeUpdateContent(initialContent);
          initializedRef.current = documentTitle;
        }
      }, 200); // Increased delay to give storage more time to load
      
      return () => clearTimeout(timer);
    }
  }, [documentTitle, initialContent, onError, isStorageLoaded, content]);

  // Focus editor on mount
  useEffect(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);

  // Handle clicks on note links
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('note-link')) {
        event.preventDefault();
        event.stopPropagation();
        
        const noteName = target.getAttribute('data-note-name');
        if (noteName) {
          goToNote(noteName);
        }
      }
    };

    // Add click listener to the editor container
    const editorElement = editor?.view.dom;
    if (editorElement) {
      editorElement.addEventListener('click', handleClick);
      return () => {
        editorElement.removeEventListener('click', handleClick);
      };
    }
  }, [editor, goToNote]);

  // User colors are handled by the Liveblocks extension through UserMeta
  // The extension automatically uses colors from the resolveUsers function

  // Notify parent component of user count changes
  useEffect(() => {
    if (onUserCountChange) {
      onUserCountChange(others.length);
    }
  }, [others.length, onUserCountChange]);

  if (!editor) {
    return (
      <div className="tiptap-loading">
        <div className="loading-text">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="tiptap-editor-container" style={{ position: 'relative' }}>
      <EditorContent editor={editor} />
    </div>
  );
}
