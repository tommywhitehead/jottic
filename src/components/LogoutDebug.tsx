import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LogoutDebug() {
  const { user, session, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      user: user ? { id: user.id, email: user.email } : null,
      session: session ? { access_token: session.access_token ? 'present' : 'missing' } : null,
      loading,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    setDebugInfo(info);
  }, [user, session, loading]);

  // Only show in development or when there's an issue
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '10px',
      fontFamily: 'monospace',
      maxWidth: '300px',
      zIndex: 9999,
      borderRadius: '4px'
    }}>
      <div><strong>Auth Debug:</strong></div>
      <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Session: {session ? 'Present' : 'None'}</div>
      <div>URL: {window.location.pathname}</div>
      <pre style={{ fontSize: '8px', margin: '5px 0 0 0' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}
