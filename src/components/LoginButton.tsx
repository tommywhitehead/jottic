import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className = '' }: LoginButtonProps) {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  if (loading) {
    return (
      <span className={`header-link ${className}`}>
        loading...
      </span>
    );
  }

  if (user) {
    return (
      <span 
        className={`header-link ${className}`}
        onClick={signOut}
        style={{ cursor: 'pointer' }}
      >
        logout
      </span>
    );
  }

  return (
    <span 
      className={`header-link ${className}`}
      onClick={signInWithGoogle}
      style={{ cursor: 'pointer' }}
    >
      login
    </span>
  );
}
