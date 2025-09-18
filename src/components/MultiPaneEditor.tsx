import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOthers } from '../lib/liveblocks';
import { AuthenticatedRoomProvider } from './AuthenticatedRoomProvider';
import { TiptapEditor } from './TiptapEditor';
import { useNotes } from '../hooks/useNotes';
import svgPaths from '../imports/svg-4qeuqv3u0r';

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
  const { note, saveNote } = useNotes(noteTitle);
  
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
        onTypingChange={onTypingChange}
      />
    </div>
  );
}

function JotticLogo() {
  return (
    <div className="logo" data-name="Jottic">
      <svg className="logo-svg" fill="none" preserveAspectRatio="none" viewBox="0 0 50 13">
        <g id="Jottic">
          <path d={svgPaths.p1c133f80} fill="var(--fill-0, #464646)" id="Vector" />
          <path d={svgPaths.p16897f80} fill="var(--fill-0, #464646)" id="Vector_2" />
          <path d={svgPaths.p7476d00} fill="var(--fill-0, #464646)" id="Vector_3" />
          <path d={svgPaths.p1ac03e00} fill="var(--fill-0, #464646)" id="Vector_4" />
          <path d={svgPaths.p2eac9c00} fill="var(--fill-0, #464646)" id="Vector_5" />
          <path d={svgPaths.p7638900} fill="var(--fill-0, #464646)" id="Vector_6" />
        </g>
      </svg>
    </div>
  );
}

function Header({ noteCount }: { noteCount: number }) {
  return (
    <div className="header">
      <JotticLogo />
      <div className="header-nav">
        <span className="header-link">{noteCount} notes</span>
        <span className="header-link">dark</span>
        <span className="header-link">login</span>
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

  // Update active pane to rightmost when noteTitles change
  useEffect(() => {
    if (noteTitles.length > 0) {
      const lastIndex = noteTitles.length - 1;
      setActivePaneIndex(lastIndex);
    }
  }, [noteTitles]);

  // Handle pane click to set active pane
  const handlePaneClick = (index: number) => {
    setActivePaneIndex(index);
  };

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

  // Robust scroll to rightmost pane function
  const scrollToRightmost = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Force a reflow to ensure layout is complete
      container.offsetHeight;
      // Scroll to the very end
      container.scrollLeft = container.scrollWidth - container.clientWidth;
    }
  };

  // Enhanced scroll function using requestAnimationFrame
  const scrollToRightmostWithRAF = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToRightmost();
      });
    });
  };

  // Auto-scroll to the rightmost pane and focus it on load
  useEffect(() => {
    const focusLastPane = () => {
      if (noteTitles.length > 0) {
        const lastIndex = noteTitles.length - 1;
        setActivePaneIndex(lastIndex);
        
        // Try to focus the editor within the last pane with multiple attempts
        const attemptFocus = (attempts = 0) => {
          const lastPane = document.querySelector(`[data-pane-index="${lastIndex}"]`);
          if (lastPane) {
            const editor = lastPane.querySelector('.ProseMirror');
            if (editor) {
              (editor as HTMLElement).focus();
              return true;
            }
          }
          
          // Retry up to 5 times with increasing delays
          if (attempts < 5) {
            setTimeout(() => attemptFocus(attempts + 1), 100 * (attempts + 1));
          }
          return false;
        };
        
        attemptFocus();
      }
    };

    // Multiple scroll attempts with increasing delays to ensure it works
    const scrollAttempts = [0, 50, 100, 200, 500];
    
    scrollAttempts.forEach((delay) => {
      setTimeout(() => {
        scrollToRightmostWithRAF();
        focusLastPane();
      }, delay);
    });
  }, [noteTitles]);

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
      
    </div>
  );
}
