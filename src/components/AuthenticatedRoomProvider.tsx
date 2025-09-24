import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RoomProvider } from '../lib/liveblocks';

interface AuthenticatedRoomProviderProps {
  id: string;
  initialPresence: any;
  initialStorage: any;
  children: React.ReactNode;
}

export function AuthenticatedRoomProvider({ 
  id, 
  initialPresence, 
  initialStorage, 
  children 
}: AuthenticatedRoomProviderProps) {
  const { user, loading, signInWithGoogle } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'monospace'
      }}>
        <div className="loading-ui">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, show sign in screen
  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'monospace',
        textAlign: 'center',
        padding: '20px',
        background: 'var(--background, #ffffff)',
        color: 'var(--foreground, #000000)'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'normal', 
            margin: '0 0 8px 0',
            color: 'var(--foreground, #000000)'
          }}>
            Jottic
          </h1>
          <p style={{ 
            fontSize: '14px', 
            margin: '0',
            opacity: 0.7,
            color: 'var(--foreground, #000000)'
          }}>
            Collaborative note-taking
          </p>
        </div>
        
        <button
          onClick={signInWithGoogle}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px', 
            border: '1px solid #dadce0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            background: '#ffffff',
            color: '#3c4043',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            e.currentTarget.style.borderColor = '#c1c7cd';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = '#dadce0';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  // User is authenticated, render the room provider
  return (
    <RoomProvider
      id={id}
      initialPresence={initialPresence}
      initialStorage={initialStorage}
    >
      {children}
    </RoomProvider>
  );
}
