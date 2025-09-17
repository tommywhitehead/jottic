import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomProvider, useOthers } from '../lib/liveblocks';
import { TiptapEditor } from './TiptapEditor';
import { useNotes } from '../hooks/useNotes';
import { useActivePane } from '../hooks/useActivePane';
import svgPaths from '../imports/svg-4qeuqv3u0r';

interface SplitScreenEditorProps {
  leftNoteTitle: string;
  rightNoteTitle: string;
}

// Component to wrap each pane with user count
function PaneWithUserCount({ 
  noteTitle, 
  note, 
  onSave, 
  onTypingChange,
  isTyping,
  isPageLoaded,
  onClose
}: {
  noteTitle: string;
  note: any;
  onSave?: (content: string) => void;
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
        documentTitle={noteTitle}
        onSave={onSave}
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

function Header() {
  return (
    <div className="header">
      <JotticLogo />
      <div className="header-nav">
        <span className="header-link">dark</span>
        <span className="header-link">login</span>
      </div>
    </div>
  );
}

export function SplitScreenEditor({ leftNoteTitle, rightNoteTitle }: SplitScreenEditorProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const navigate = useNavigate();
  
  // Refs for the panes
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  
  // Get notes for both panes
  const leftNote = useNotes(leftNoteTitle);
  const rightNote = useNotes(rightNoteTitle);
  
  // Track which pane is active
  const { activePane, isLeftActive, isRightActive } = useActivePane({
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
          <div className="split-screen-layout">
          {/* Left pane */}
          <div className={`split-pane ${isLeftActive ? 'active' : 'inactive'}`} ref={leftPaneRef}>
            <RoomProvider 
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
                onTypingChange={setIsTyping}
                isTyping={isTyping}
                isPageLoaded={isPageLoaded}
                onClose={() => navigate(`/${rightNoteTitle}`)}
              />
            </RoomProvider>
          </div>

          {/* Right pane */}
          <div className={`split-pane ${isRightActive ? 'active' : 'inactive'}`} ref={rightPaneRef}>
            <RoomProvider 
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
                onTypingChange={setIsTyping}
                isTyping={isTyping}
                isPageLoaded={isPageLoaded}
                onClose={() => navigate(`/${leftNoteTitle}`)}
              />
            </RoomProvider>
          </div>
          </div>
        </div>
    </div>
  );
}
