import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className = '' }: LoginButtonProps) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Clear any stored intended URL
      sessionStorage.removeItem('intendedUrl');
      localStorage.removeItem('intendedUrl');
      
      // Sign out from Supabase
      await signOut();
      
      // Redirect to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if logout fails, clear storage and redirect to login
      sessionStorage.removeItem('intendedUrl');
      localStorage.removeItem('intendedUrl');
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

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
        onClick={handleLogout}
        style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
      >
        {isLoggingOut ? 'logging out...' : 'logout'}
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
