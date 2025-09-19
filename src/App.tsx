import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import svgPaths from "./imports/svg-4qeuqv3u0r";
import { useNotes } from './hooks/useNotes';
import { FallbackEditor } from './components/FallbackEditor';
import { CollaborativeEditor } from './components/CollaborativeEditor';
import { TiptapEditor } from './components/TiptapEditor';
import { SplitScreenEditor } from './components/SplitScreenEditor';
import { MultiPaneEditor } from './components/MultiPaneEditor';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginButton } from './components/LoginButton';
import { LoginPage } from './components/LoginPage';
import { LogoutPage } from './components/LogoutPage';
import { AuthCallback } from './components/AuthCallback';
import { AuthenticatedRoomProvider } from './components/AuthenticatedRoomProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LogoutDebug } from './components/LogoutDebug';
import { JotticLogo } from './components/JotticLogo';
import { useOthers } from './lib/liveblocks';
import { supabase } from './lib/supabase';
import { generateRandomId } from './lib/randomId';
import './App.css';

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
          <h1>Something went wrong</h1>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}



function Header() {
  const { user } = useAuth();
  
  return (
    <div className="header">
      <JotticLogo />
      <div className="header-nav">
        <span className="header-link">dark</span>
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

function AppContent() {
  const [isTyping, setIsTyping] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const others = useOthers();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // Get document title from URL path
  const getDocumentTitle = () => {
    const path = location.pathname;
    // Remove leading slash and return the path as document name
    return path.substring(1);
  };
  
  const documentTitle = getDocumentTitle();
  
  // Create room ID based on document title
  const roomId = `document-${documentTitle}`;
  
  // Use the notes hook for Supabase integration
  const { note, loading, saving, error, saveNote, flushPendingSave } = useNotes(documentTitle);
  
  // Handle navigation state and page load delay
  useEffect(() => {
    setIsNavigating(true);
    setIsPageLoaded(false);
    
    const navigationTimer = setTimeout(() => {
      setIsNavigating(false);
    }, 300); // Brief loading state
    
    const pageLoadTimer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 2000); // 2 second delay before fade behavior starts
    
    return () => {
      clearTimeout(navigationTimer);
      clearTimeout(pageLoadTimer);
    };
  }, [documentTitle]);

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
        <div className="editor-container" ref={editorContainerRef}>
        <div className={`document-title-fade ${isTyping && isPageLoaded ? 'faded' : ''}`}>
          <div className="document-title">
            /{documentTitle}
            {others.length > 0 && (
              <span className="user-count">
                {others.length + 1} ppl
              </span>
            )}
          </div>
        </div>
        
        {/* Status indicators - always visible */}
        <div className="status-container">
          {saving && <span className="status-indicator saving">saving...</span>}
          {(loading || isNavigating) && <span className="status-indicator loading">loading...</span>}
          {error && <span className="status-indicator error">error</span>}
        </div>
        
        <TiptapEditor 
          key={documentTitle}
          documentTitle={documentTitle}
          onSave={saveNote}
          initialContent={note?.content || ''}
          onTypingChange={setIsTyping}
          onBeforeNavigate={flushPendingSave}
        />
        </div>
      </div>
    </div>
  );
}

async function generateUnusedNoteId(maxAttempts = 5): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generateRandomId();

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id')
        .eq('title', candidate)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to verify note availability:', error);
        break;
      }

      if (!data) {
        return candidate;
      }
    } catch (error) {
      console.error('Error generating unique note id:', error);
      break;
    }
  }

  const fallbackSuffix = Date.now().toString(36).slice(-4);
  return `${generateRandomId()}-${fallbackSuffix}`;
}

function AppWithAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Auto-redirect to new note when visiting root URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '') {
      let cancelled = false;

      const redirectToNewNote = async () => {
        const noteId = await generateUnusedNoteId();
        if (!cancelled) {
          navigate(`/${noteId}`, { replace: true });
        }
      };

      redirectToNewNote();

      return () => {
        cancelled = true;
      };
    }
  }, [location.pathname, navigate]);
  
  // Update document title based on current URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '') {
      document.title = 'Jottic';
    } else {
      const segments = path.substring(1).split('/');
      const titleParts = ['Jottic', ...segments];
      document.title = titleParts.join(' • ');
    }
  }, [location.pathname]);
  
  // Check if this is a multi-pane URL (contains 2-10 path segments)
  const isMultiPane = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return false;
    
    // Remove leading slash and split by '/'
    const segments = path.substring(1).split('/');
    return segments.length >= 2 && segments.length <= 10;
  };
  
  // Parse multi-pane URLs
  const getMultiPaneNotes = () => {
    const path = location.pathname;
    const segments = path.substring(1).split('/');
    return segments.filter(segment => segment.length > 0);
  };
  
  // Get document title from URL path for room ID (single note)
  const getDocumentTitle = () => {
    const path = location.pathname;
    return path.substring(1);
  };
  
  const documentTitle = getDocumentTitle();
  const roomId = `document-${documentTitle}`;

  // If we're at the root path, render a lightweight placeholder without
  // mounting any editor or Liveblocks room to avoid connecting to a stale
  // temporary room (e.g., `document-`). The effect above will navigate to
  // a fresh, unused note id immediately.
  if (location.pathname === '/' || location.pathname === '') {
    return (
      <ErrorBoundary>
        <div className="app">
          <div className="header-fade">
            <Header />
          </div>
          <div className="main-layout">
            <div className="editor-container">
              <div className="status-container">
                <span className="status-indicator loading">loading...</span>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Render multi-pane if URL has 2-10 segments
  if (isMultiPane()) {
    const noteTitles = getMultiPaneNotes();
    
    // For exactly 2 notes, use the optimized SplitScreenEditor
    if (noteTitles.length === 2) {
      return (
        <ErrorBoundary>
          <SplitScreenEditor 
            leftNoteTitle={noteTitles[0]}
            rightNoteTitle={noteTitles[1]}
          />
        </ErrorBoundary>
      );
    }
    
    // For 3-10 notes, use MultiPaneEditor
    return (
      <ErrorBoundary>
        <MultiPaneEditor noteTitles={noteTitles} />
      </ErrorBoundary>
    );
  }

  // Render single note view
  return (
    <ErrorBoundary>
      <AuthenticatedRoomProvider 
        id={roomId}
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
        <AppContent />
      </AuthenticatedRoomProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LogoutDebug />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={
          <ProtectedRoute>
            <AppWithAuth />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}
