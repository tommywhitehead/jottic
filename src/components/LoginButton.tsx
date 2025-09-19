import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className = '' }: LoginButtonProps) {
  const { user, loading, signOut, forceLogout } = useAuth();
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
      
      // Use window.location as fallback for production
      try {
        navigate('/login', { replace: true });
        // If navigate doesn't work, use window.location after a short delay
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 100);
      } catch (navError) {
        console.error('Navigation error, using window.location:', navError);
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Use forceLogout as ultimate fallback
      forceLogout();
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
