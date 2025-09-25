import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOthers } from '../lib/liveblocks';
import { AuthenticatedRoomProvider } from './AuthenticatedRoomProvider';
import { TiptapEditor } from './TiptapEditor';
import { useNotes } from '../hooks/useNotes';
import { useActivePane } from '../hooks/useActivePane';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LoginButton } from './LoginButton';
import { JotticLogo } from './JotticLogo';

interface SplitScreenEditorProps {
  leftNoteTitle: string;
  rightNoteTitle: string;
}

// Component to wrap each pane with user count
function PaneWithUserCount({ 
  noteTitle, 
  note, 
  onSave, 
  onBeforeNavigate,
  onTypingChange,
  isTyping,
  isPageLoaded,
  onClose
}: {
  noteTitle: string;
  note: any;
  onSave?: (content: string) => void;
  onBeforeNavigate?: () => Promise<void> | void;
  onTypingChange?: (isTyping: boolean) => void;
  isTyping: boolean;
  isPageLoaded: boolean;
  onClose: () => void;
}) {
  const others = useOthers();
  
  return (
    <div className="editor-container">
      <div className={`document-title-fade ${isTyping && isPageLoaded ? 'faded' : ''} ${noteTitle === 'home' ? 'hidden' : ''}`}>
        <div className="document-title">
          /{noteTitle}
          {others.length > 0 && (
            <span className="user-count">
              {others.length + 1} ppl
            </span>
          )}
          <span className="close-text" onClick={onClose}>
            close
          </span>
        </div>
      </div>
      
      <div className="status-container">
        {/* Status indicators would go here if needed */}
      </div>
      
      <TiptapEditor 
        key={noteTitle}
        documentTitle={noteTitle}
        onSave={onSave}
        initialContent={note?.content || ''}
        onBeforeNavigate={onBeforeNavigate}
        onTypingChange={onTypingChange}
      />
    </div>
  );
}


function Header() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className="header">
      <JotticLogo />
      <div className="header-nav">
        <span 
          className="header-link"
          style={{ cursor: 'pointer' }}
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? 'light' : 'dark'}
        </span>
        <LoginButton />
        {user && (
          <span className="header-link user-display">
            {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
          </span>
        )}
      </div>
    </div>
  );
}

export function SplitScreenEditor({ leftNoteTitle, rightNoteTitle }: SplitScreenEditorProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  
  // Refs for the panes
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get notes for both panes
  const leftNote = useNotes(leftNoteTitle);
  const rightNote = useNotes(rightNoteTitle);
  
  // Track which pane is active
  const { isLeftActive, isRightActive } = useActivePane({
    leftPaneRef: leftPaneRef as React.RefObject<HTMLElement>,
    rightPaneRef: rightPaneRef as React.RefObject<HTMLElement>
  });

  // Handle closing notes
  const handleCloseNote = () => {
    if (isLeftActive) {
      // Close left note, navigate to right note
      navigate(`/${rightNoteTitle}`);
    } else if (isRightActive) {
      // Close right note, navigate to left note
      navigate(`/${leftNoteTitle}`);
    }
  };

  // Sync active pane with scroll position on mobile swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const panes = [leftPaneRef.current, rightPaneRef.current].filter(Boolean) as HTMLDivElement[];
    if (panes.length !== 2) return;

    const updateIndex = () => {
      const width = container.clientWidth;
      if (width <= 0) return;
      const index = Math.round(container.scrollLeft / width);
      setCurrentIndex(index);
    };

    const onScroll = () => {
      requestAnimationFrame(updateIndex);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    // Initialize index on mount
    requestAnimationFrame(() => onScroll());

    return () => container.removeEventListener('scroll', onScroll as EventListener);
  }, [isLeftActive, isRightActive]);

  // Simple ESC close functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseNote();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [leftNoteTitle, rightNoteTitle, handleCloseNote]);

  // Page load delay
  useEffect(() => {
    const pageLoadTimer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 2000); // 2 second delay before fade behavior starts
    
    return () => clearTimeout(pageLoadTimer);
  }, []);

  // On mount or when pane titles change, ensure correct auto-scroll/focus per platform
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    if (isMobile) {
      // On mobile 1->2: scroll to new (right) pane and focus it
      requestAnimationFrame(() => {
        const width = container.clientWidth;
        container.scrollTo({ left: width, behavior: 'smooth' });
        setTimeout(() => {
          const editor = rightPaneRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
          editor?.focus();
        }, 180);
      });
    } else {
      // On desktop 1->2: both panes visible equally (no scroll). Optionally focus right pane
      setTimeout(() => {
        const editor = rightPaneRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
        editor?.focus();
      }, 150);
    }
  }, [leftNoteTitle, rightNoteTitle]);

  // Handle mouse movement to fade UI back in
  useEffect(() => {
    const handleMouseMove = () => {
      if (isTyping && isPageLoaded) {
        setIsTyping(false);
      }
    };

    if (isTyping && isPageLoaded) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isTyping, isPageLoaded]);

  return (
    <div className="app">
      <div className={`header-fade ${isTyping && isPageLoaded ? 'faded' : ''}`}>
        <Header />
      </div>
      
        <div className="main-layout">
          <div className="split-screen-layout" ref={containerRef}>
          {/* Left pane */}
          <div className={`split-pane ${isLeftActive ? 'active' : 'inactive'}`} ref={leftPaneRef}>
            <AuthenticatedRoomProvider 
              id={`document-${leftNoteTitle}`}
              initialPresence={{
                cursor: null,
                selection: null,
                user: {
                  name: `User ${Math.floor(Math.random() * 1000)}`,
                  color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                },
              }}
              initialStorage={{
                content: '',
                lastModified: Date.now(),
              }}
            >
              <PaneWithUserCount
                noteTitle={leftNoteTitle}
                note={leftNote.note}
                onSave={leftNoteTitle !== 'home' ? leftNote.saveNote : undefined}
                onBeforeNavigate={leftNote.flushPendingSave}
                onTypingChange={setIsTyping}
                isTyping={isTyping}
                isPageLoaded={isPageLoaded}
                onClose={() => navigate(`/${rightNoteTitle}`)}
              />
            </AuthenticatedRoomProvider>
          </div>

          {/* Right pane */}
          <div className={`split-pane ${isRightActive ? 'active' : 'inactive'}`} ref={rightPaneRef}>
            <AuthenticatedRoomProvider 
              id={`document-${rightNoteTitle}`}
              initialPresence={{
                cursor: null,
                selection: null,
                user: {
                  name: `User ${Math.floor(Math.random() * 1000)}`,
                  color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                },
              }}
              initialStorage={{
                content: '',
                lastModified: Date.now(),
              }}
            >
              <PaneWithUserCount
                noteTitle={rightNoteTitle}
                note={rightNote.note}
                onSave={rightNoteTitle !== 'home' ? rightNote.saveNote : undefined}
                onBeforeNavigate={rightNote.flushPendingSave}
                onTypingChange={setIsTyping}
                isTyping={isTyping}
                isPageLoaded={isPageLoaded}
                onClose={() => navigate(`/${leftNoteTitle}`)}
              />
            </AuthenticatedRoomProvider>
          </div>
          </div>
        </div>
        <div className={`header-fade ${isTyping && isPageLoaded ? 'faded' : ''}`}>
          {currentIndex > 0 && (
            <button
              type="button"
              className="prev-pane-btn"
              aria-label="Previous pane"
              onClick={() => {
                const container = containerRef.current;
                if (!container) return;
                const width = container.clientWidth;
                const prev = Math.max(currentIndex - 1, 0);
                const targetLeft = prev * width;
                container.scrollTo({ left: targetLeft, behavior: 'smooth' });
              }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          )}
          {currentIndex < 1 && (
            <button
              type="button"
              className="next-pane-btn"
              aria-label="Next pane"
              onClick={() => {
                const container = containerRef.current;
                if (!container) return;
                const width = container.clientWidth;
                const next = Math.min(currentIndex + 1, 1);
                const targetLeft = next * width;
                container.scrollTo({ left: targetLeft, behavior: 'smooth' });
              }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          )}
        </div>
    </div>
  );
}
