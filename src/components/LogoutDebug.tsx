import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export function LogoutDebug() {
  const { user, session, loading, forceLogout } = useAuth();
  const location = useLocation();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const info = {
      user: user ? { id: user.id, email: user.email } : null,
      session: session ? { access_token: session.access_token ? 'present' : 'missing' } : null,
      loading,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      pathname: location.pathname,
      environment: process.env.NODE_ENV,
      storage: {
        sessionStorage: {
          intendedUrl: sessionStorage.getItem('intendedUrl'),
          keys: Object.keys(sessionStorage).length
        },
        localStorage: {
          keys: Object.keys(localStorage).length
        }
      },
      performance: {
        memory: (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024) + 'MB'
        } : 'Not available'
      }
    };
    setDebugInfo(info);
  }, [user, session, loading, location]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Debug: Log key events to help troubleshoot
      if (event.metaKey || event.ctrlKey) {
        console.log('Debug hotkey attempt:', {
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          key: event.key,
          code: event.code
        });
      }

      // Multiple hotkey options for better compatibility
      const isDebugHotkey = (
        // Cmd+Shift+1 or Ctrl+Shift+1
        ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === '1' || event.code === 'Digit1')) ||
        // Cmd+Shift+D or Ctrl+Shift+D (D for Debug)
        ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'd' || event.key === 'D' || event.code === 'KeyD')) ||
        // Cmd+Shift+! or Ctrl+Shift+! (original)
        ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === '!' || event.code === 'Digit1'))
      );
      
      if (isDebugHotkey) {
        event.preventDefault();
        console.log('Debug panel toggled!');
        setIsVisible(prev => !prev);
      }
      
      // Also allow ESC to close
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Expose debug toggle function globally for testing
    (window as any).toggleDebug = () => {
      console.log('Debug panel toggled via window.toggleDebug()');
      setIsVisible(prev => !prev);
    };
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      delete (window as any).toggleDebug;
    };
  }, [isVisible]);

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      padding: '15px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999,
      borderRadius: '8px',
      border: '1px solid #333',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        borderBottom: '1px solid #333',
        paddingBottom: '8px'
      }}>
        <div><strong>🔧 Debug Panel</strong></div>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid #555',
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: '10px',
            borderRadius: '3px'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <div><strong>Authentication:</strong></div>
        <div>• User: {user ? '✅ Logged in' : '❌ Not logged in'}</div>
        <div>• Loading: {loading ? '⏳ Yes' : '✅ No'}</div>
        <div>• Session: {session ? '✅ Present' : '❌ None'}</div>
        <div>• URL: {window.location.pathname}</div>
        <div>• Environment: {process.env.NODE_ENV}</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div><strong>Storage:</strong></div>
        <div>• Intended URL: {sessionStorage.getItem('intendedUrl') || 'None'}</div>
        <div>• SessionStorage keys: {Object.keys(sessionStorage).length}</div>
        <div>• LocalStorage keys: {Object.keys(localStorage).length}</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div><strong>Performance:</strong></div>
        <div>• Memory: {(performance as any).memory ? 
          `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)}MB` : 
          'Not available'}</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div><strong>Actions:</strong></div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '9px',
              borderRadius: '4px'
            }}
          >
            🔄 Reload
          </button>
          
          <button 
            onClick={() => {
              sessionStorage.clear();
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              background: '#ffc107',
              color: 'black',
              border: 'none',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '9px',
              borderRadius: '4px'
            }}
          >
            🗑️ Clear Storage
          </button>

          {user && (
            <button 
              onClick={forceLogout}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '9px',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              🚨 Force Logout
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div><strong>Hotkeys:</strong></div>
        <div>• <kbd>Cmd+Shift+1</kbd> or <kbd>Ctrl+Shift+1</kbd> - Toggle debug</div>
        <div>• <kbd>Cmd+Shift+D</kbd> or <kbd>Ctrl+Shift+D</kbd> - Toggle debug</div>
        <div>• <kbd>Cmd+Shift+!</kbd> or <kbd>Ctrl+Shift+!</kbd> - Toggle debug</div>
        <div>• <kbd>Esc</kbd> - Close debug panel</div>
        <div style={{ fontSize: '9px', color: '#ccc', marginTop: '4px' }}>
          Or type <code>window.toggleDebug()</code> in console
        </div>
      </div>

      <details style={{ marginTop: '10px' }}>
        <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>
          <strong>Raw Debug Data</strong>
        </summary>
        <pre style={{ 
          fontSize: '8px', 
          margin: '5px 0 0 0',
          background: 'rgba(255,255,255,0.1)',
          padding: '8px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
}
