import React, { useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useLiveblocksExtension } from '@liveblocks/react-tiptap';
import StarterKit from '@tiptap/starter-kit';
import { useStorage, useMutation, useMyPresence, useOthers } from '../lib/liveblocks';
import { NoteLinkExtension } from './NoteLinkExtension';
import { useNoteNavigation } from '../lib/noteNavigation';

interface TiptapEditorProps {
  documentTitle: string;
  onSave?: (content: string) => void;
  initialContent?: string;
  onTypingChange?: (isTyping: boolean) => void;
  onError?: () => void;
  onUserCountChange?: (count: number) => void;
  onBeforeNavigate?: () => Promise<void> | void;
}

export function TiptapEditor({ 
  documentTitle, 
  onSave, 
  initialContent = '', 
  onTypingChange,
  onError,
  onUserCountChange,
  onBeforeNavigate
}: TiptapEditorProps) {
  const content = useStorage((root) => root?.content);
  
  // Track if we've initialized content for this document
  const initializedRef = useRef<string | null>(null);
  const firstUpdateSkippedRef = useRef<boolean>(false);
  
  // Cursor and presence management
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  
  // Note navigation functionality
  const { goToNote } = useNoteNavigation();

  const handleNavigateToNoteRef = useRef(onBeforeNavigate);

  useEffect(() => {
    handleNavigateToNoteRef.current = onBeforeNavigate;
  }, [onBeforeNavigate]);

  const navigateToNote = useCallback((noteName: string) => {
    // Defer navigation beyond current render of any sibling editors
    setTimeout(() => {
      Promise.resolve(handleNavigateToNoteRef.current?.()).finally(() => {
        goToNote(noteName);
      });
    }, 0);
  }, [goToNote]);

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

  // Mutation to update content - only call when storage is loaded
  const updateContent = useMutation(({ storage }, newContent: string) => {
    if (storage) {
      storage.set('content', newContent);
      storage.set('lastModified', Date.now());
    }
  }, []);

  const isStorageLoaded = content !== undefined;

  const safeUpdateContent = useCallback((newContent: string) => {
    if (!isStorageLoaded) {
      return;
    }

    if (typeof content === 'string' && content === newContent) {
      return;
    }

    try {
      updateContent(newContent);
    } catch (error) {
      if (!(error instanceof Error) || !error.message?.includes('storage has been loaded')) {
        console.error('Failed to update Liveblocks content:', error);
      }
    }
  }, [content, isStorageLoaded, updateContent]);

  const normalizeContent = useCallback((value?: string) => {
    if (!value) return '';
    return value;
  }, []);

  const hasMeaningfulContent = useCallback((value?: string) => {
    if (!value) return false;
    const text = value
      .replace(/<p><\/p>/g, '')
      .replace(/<br\s*\/?>(\s*<br\s*\/?>)*/g, '')
      .replace(/\s+/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();
    return text.length > 0;
  }, []);

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
        onLinkCreated: navigateToNote,
      }),
  ],
    // Initialize with empty content. Liveblocks storage is the source of truth
    // and will hydrate the editor once loaded. We bootstrap storage separately
    // from Supabase or local draft when needed.
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      
      // Only update content if storage is loaded. Defer the mutation to avoid
      // triggering state updates while sibling panes are mounting.
      if (isStorageLoaded) {
        setTimeout(() => safeUpdateContent(html), 0);
      }
      
      // Notify parent about typing state
      if (onTypingChange) {
        // Skip the very first onUpdate triggered by initial mount to avoid
        // setState during render warnings and incorrect typing state
        if (!firstUpdateSkippedRef.current) {
          firstUpdateSkippedRef.current = true;
        } else {
          // Defer to the macrotask queue to ensure we're past any concurrent
          // React renders of sibling editors when adding panes
          setTimeout(() => onTypingChange(html.length > 0), 0);
        }
      }
      
      // Call the onSave callback for Supabase integration
      if (onSave) {
        // Defer save signal to avoid triggering state updates in hooks while
        // a sibling editor is mounting
        setTimeout(() => onSave(html), 0);
      }

      // Persist a local draft so rapid navigations (e.g., switching to multi-pane)
      // don't lose unsaved content due to race conditions with network saves
      try {
        const draftKey = `draft-${documentTitle}`;
        window.sessionStorage.setItem(draftKey, html);
      } catch (_) {
        // Ignore storage errors
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Handle selection changes for collaboration (deferred)
      const { from, to } = editor.state.selection;
      setTimeout(() => {
        updateMyPresence({
          selection: { anchor: from, focus: to }
        });
      }, 0);
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
  }, [documentTitle, navigateToNote]); // Force recreation only when document changes

  useEffect(() => {
    if (!isStorageLoaded || initializedRef.current === documentTitle) {
      return;
    }

    const liveblocksContent = typeof content === 'string' ? content : '';
    const normalizedInitial = normalizeContent(initialContent);
    const shouldBootstrapFromSupabase = hasMeaningfulContent(normalizedInitial) && liveblocksContent !== normalizedInitial;

    if (shouldBootstrapFromSupabase) {
      safeUpdateContent(normalizedInitial);
    }

    if (!hasMeaningfulContent(normalizedInitial) && !hasMeaningfulContent(liveblocksContent)) {
      // Attempt to recover any local draft if both sources are empty
      try {
        const draftKey = `draft-${documentTitle}`;
        const draft = window.sessionStorage.getItem(draftKey) || '';
        if (hasMeaningfulContent(draft)) {
          // Only update storage; Liveblocks will hydrate the editor
          safeUpdateContent(draft);
        } else {
          safeUpdateContent('');
        }
      } catch (_) {
        safeUpdateContent('');
      }
    }

    initializedRef.current = documentTitle;
  }, [documentTitle, initialContent, isStorageLoaded, content, safeUpdateContent, normalizeContent, hasMeaningfulContent]);

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
          // Defer navigation triggered by click as well
          setTimeout(() => goToNote(noteName), 0);
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
