import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className = '' }: LoginButtonProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
        onClick={() => navigate('/logout')}
        style={{ cursor: 'pointer' }}
      >
        logout
      </span>
    );
  }

  return (
    <span 
      className={`header-link ${className}`}
      onClick={() => navigate('/login')}
      style={{ cursor: 'pointer' }}
    >
      login
    </span>
  );
}
