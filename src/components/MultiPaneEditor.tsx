import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOthers } from '../lib/liveblocks';
import { AuthenticatedRoomProvider } from './AuthenticatedRoomProvider';
import { TiptapEditor } from './TiptapEditor';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../contexts/AuthContext';
import { LoginButton } from './LoginButton';
import { useTheme } from '../contexts/ThemeContext';
import { JotticLogo } from './JotticLogo';

interface MultiPaneEditorProps {
  noteTitles: string[];
}

// Component to wrap each pane with user count
function PaneWithUserCount({ 
  noteTitle, 
  onTypingChange,
  isTyping,
  isPageLoaded,
  onClose
}: {
  noteTitle: string;
  onTypingChange?: (isTyping: boolean) => void;
  isTyping: boolean;
  isPageLoaded: boolean;
  onClose: () => void;
}) {
  const others = useOthers();
  const { note, saveNote, flushPendingSave } = useNotes(noteTitle);
  
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
        onSave={noteTitle !== 'home' ? saveNote : undefined}
        initialContent={note?.content || ''}
        onBeforeNavigate={flushPendingSave}
        onTypingChange={onTypingChange}
      />
    </div>
  );
}


function Header({ noteCount }: { noteCount: number }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className="header">
      <JotticLogo />
      <div className="header-nav">
        <span className="header-link">{noteCount} notes</span>
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

export function MultiPaneEditor({ noteTitles }: MultiPaneEditorProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const navigate = useNavigate();

  
  // Safety check for noteTitles
  if (!noteTitles || !Array.isArray(noteTitles) || noteTitles.length === 0) {
    return (
      <div className="app">
        <div className="header-fade">
          <Header noteCount={0} />
        </div>
        <div className="main-layout">
          <div className="error-message">No notes to display</div>
        </div>
      </div>
    );
  }
  
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const scrollEndTimerRef = useRef<number | null>(null);
  const hasInitialScrollRef = useRef<boolean>(false);
  
  // Get notes for all panes - we'll load them individually in each pane component
  // This avoids the Rules of Hooks violation
  
  // Track which pane is active - simple state management
  // Initialize with the rightmost pane (last index) as active
  const [activePaneIndex, setActivePaneIndex] = useState<number | null>(
    noteTitles.length > 0 ? noteTitles.length - 1 : null
  );
  
  const isPaneActive = (index: number) => {
    return activePaneIndex === index;
  };

  // When a new pane is added (URL grows), activate and reveal the new rightmost pane
  const prevLengthRef = useRef<number>(noteTitles.length);
  useEffect(() => {
    const prev = prevLengthRef.current;
    const curr = noteTitles.length;
    if (curr > prev && curr > 0) {
      // Always mark the new pane as active
      setActivePaneIndex(curr - 1);

      // Smoothly reveal and focus last pane on desktop; mobile handled by activePaneIndex effect
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      if (!isMobile && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        // Mark as programmatic to avoid scroll handler changing index mid-flight
        isProgrammaticScrollRef.current = true;

        const scrollToRightmost = () => {
          const targetLeft = container.scrollWidth - container.clientWidth;
          container.scrollTo({ left: targetLeft, behavior: 'smooth' });
        };

        // Perform several attempts to ensure layout is ready
        const attemptDelays = [0, 50, 100, 200, 350];
        attemptDelays.forEach((delay) => {
          setTimeout(() => {
            requestAnimationFrame(scrollToRightmost);
          }, delay);
        });

        // Reset the programmatic flag after animation likely completes
        const resetTimer = window.setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 600);

        // Robust focus with a few retries to wait for mount/layout
        const tryFocus = (attempt = 0) => {
          const pane = document.querySelector(`[data-pane-index="${curr - 1}"]`);
          const editor = pane?.querySelector('.ProseMirror') as HTMLElement | null;
          if (editor) {
            editor.focus();
            return;
          }
          if (attempt < 6) {
            const delays = [80, 120, 180, 250, 350, 500];
            setTimeout(() => tryFocus(attempt + 1), delays[attempt] || 200);
          }
        };
        tryFocus(0);

        return () => {
          window.clearTimeout(resetTimer);
        };
      }
    }
    prevLengthRef.current = curr;
  }, [noteTitles]);

  // On initial load with multiple panes, ensure the last pane is visible and focused
  useEffect(() => {
    if (hasInitialScrollRef.current) return;
    if (!noteTitles || noteTitles.length === 0) return;
    hasInitialScrollRef.current = true;

    const lastIndex = noteTitles.length - 1;
    setActivePaneIndex(lastIndex);

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const container = scrollContainerRef.current;

    if (!isMobile && container) {
      isProgrammaticScrollRef.current = true;

      const scrollToRightmost = () => {
        const targetLeft = container.scrollWidth - container.clientWidth;
        container.scrollTo({ left: targetLeft, behavior: 'smooth' });
      };

      const attemptDelays = [0, 50, 100, 200, 350];
      attemptDelays.forEach((delay) => {
        setTimeout(() => {
          requestAnimationFrame(scrollToRightmost);
        }, delay);
      });

      const resetTimer = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 600);

      const tryFocus = (attempt = 0) => {
        const pane = document.querySelector(`[data-pane-index="${lastIndex}"]`);
        const editor = pane?.querySelector('.ProseMirror') as HTMLElement | null;
        if (editor) {
          editor.focus();
          return;
        }
        if (attempt < 6) {
          const delays = [80, 120, 180, 250, 350, 500];
          setTimeout(() => tryFocus(attempt + 1), delays[attempt] || 200);
        }
      };
      tryFocus(0);

      return () => window.clearTimeout(resetTimer);
    } else {
      // On mobile, activePaneIndex effect will handle scrolling; still ensure focus
      setTimeout(() => {
        const pane = document.querySelector(`[data-pane-index="${lastIndex}"]`);
        const editor = pane?.querySelector('.ProseMirror') as HTMLElement | null;
        editor?.focus();
      }, 250);
    }
  }, [noteTitles.length]);

  // Handle pane click to set active pane
  const handlePaneClick = (index: number) => {
    setActivePaneIndex(index);
  };

  // Sync active pane with scroll position (for swipe on mobile only) using scroll-end debounce
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    if (!isMobile) {
      // On desktop, never derive active pane from scroll to avoid force scroll loops
      return;
    }

    const onScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      if (scrollEndTimerRef.current) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
      scrollEndTimerRef.current = window.setTimeout(() => {
        const width = container.clientWidth;
        if (width > 0) {
          const index = Math.round(container.scrollLeft / width);
          if (index !== activePaneIndex && index >= 0 && index < noteTitles.length) {
            setActivePaneIndex(index);
          }
        }
      }, 120);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll as EventListener);
  }, [noteTitles.length, activePaneIndex]);

  // Handle closing notes
  const handleCloseNote = () => {
    // Safety check for noteTitles
    if (!noteTitles || !Array.isArray(noteTitles) || noteTitles.length === 0) {
      navigate('/');
      return;
    }
    
    // If no pane is active, close the rightmost pane (last pane)
    const paneToClose = activePaneIndex !== null ? activePaneIndex : noteTitles.length - 1;
    
    if (paneToClose >= 0 && paneToClose < noteTitles.length) {
      // Close the selected note, navigate to the remaining notes
      const remainingNotes = noteTitles.filter((_, index) => index !== paneToClose);
      if (remainingNotes.length === 0) {
        navigate('/');
      } else if (remainingNotes.length === 1) {
        navigate(`/${remainingNotes[0]}`);
      } else {
        navigate(`/${remainingNotes.join('/')}`);
      }
    }
  };

  // Handle closing a specific note by index
  const handleCloseNoteByIndex = (indexToClose: number) => {
    // Safety check for noteTitles
    if (!noteTitles || !Array.isArray(noteTitles) || noteTitles.length === 0) {
      navigate('/');
      return;
    }
    
    if (indexToClose >= 0 && indexToClose < noteTitles.length) {
      // Close the selected note, navigate to the remaining notes
      const remainingNotes = noteTitles.filter((_, index) => index !== indexToClose);
      if (remainingNotes.length === 0) {
        navigate('/');
      } else if (remainingNotes.length === 1) {
        navigate(`/${remainingNotes[0]}`);
      } else {
        navigate(`/${remainingNotes.join('/')}`);
      }
    }
  };



  // ESC close functionality - single press
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
  }, [activePaneIndex, noteTitles]);

  // Page load delay
  useEffect(() => {
    const pageLoadTimer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 2000); // 2 second delay before fade behavior starts
    
    return () => clearTimeout(pageLoadTimer);
  }, []);

  // When active pane changes, scroll to it on mobile only and focus editor
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (activePaneIndex === null) return;

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    if (!isMobile) {
      // On desktop, do not auto-snap/scroll when active changes
      // Optionally still focus the editor in the target pane
      const pane = document.querySelector(`[data-pane-index="${activePaneIndex}"]`);
      const editor = pane?.querySelector('.ProseMirror');
      if (editor) {
        (editor as HTMLElement).focus();
      }
      return;
    }

    const width = container.clientWidth;
    const targetLeft = activePaneIndex * width;
    isProgrammaticScrollRef.current = true;
    container.scrollTo({ left: targetLeft, behavior: 'smooth' });

    const resetProgrammatic = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 300);

    // Focus editor in the active pane shortly after scrolling starts
    const focusTimer = window.setTimeout(() => {
      const pane = document.querySelector(`[data-pane-index="${activePaneIndex}"]`);
      const editor = pane?.querySelector('.ProseMirror');
      if (editor) {
        (editor as HTMLElement).focus();
      }
    }, 180);

    return () => {
      window.clearTimeout(resetProgrammatic);
      window.clearTimeout(focusTimer);
    };
  }, [activePaneIndex]);

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
        <Header noteCount={noteTitles.length} />
      </div>
      
      <div className="main-layout">
        <div className="split-screen-layout" ref={scrollContainerRef}>
          {noteTitles.map((noteTitle, index) => (
            <div 
              key={noteTitle}
              data-pane-index={index}
              className={`split-pane ${isPaneActive(index) ? 'active' : 'inactive'}`} 
              onClick={() => handlePaneClick(index)}
            >
              <AuthenticatedRoomProvider 
                id={`document-${noteTitle}`}
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
                  noteTitle={noteTitle}
                  onTypingChange={setIsTyping}
                  isTyping={isTyping}
                  isPageLoaded={isPageLoaded}
                  onClose={() => handleCloseNoteByIndex(index)}
                />
              </AuthenticatedRoomProvider>
            </div>
          ))}
        </div>
      </div>
      <div className={`header-fade ${isTyping && isPageLoaded ? 'faded' : ''}`}>
        {noteTitles.length > 1 && activePaneIndex !== null && activePaneIndex > 0 && (
          <button
            type="button"
            className="prev-pane-btn"
            aria-label="Previous pane"
            onClick={() => {
              const prev = Math.max((activePaneIndex ?? 0) - 1, 0);
              setActivePaneIndex(prev);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        )}
        {noteTitles.length > 1 && activePaneIndex !== null && activePaneIndex < noteTitles.length - 1 && (
          <button
            type="button"
            className="next-pane-btn"
            aria-label="Next pane"
            onClick={() => {
              const next = Math.min((activePaneIndex ?? 0) + 1, noteTitles.length - 1);
              setActivePaneIndex(next);
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
