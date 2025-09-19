import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LogoutPage() {
  const { signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        setIsLoggingOut(true);
        
        // Clear any stored intended URL first
        sessionStorage.removeItem('intendedUrl');
        localStorage.removeItem('intendedUrl');
        
        // Sign out from Supabase
        await signOut();
        
        // Force a small delay to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
        
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

    // Only proceed if not already loading
    if (!loading) {
      handleLogout();
    }
  }, [signOut, navigate, loading]);

  return (
    <div className="logout-page">
      <div className="logout-container">
        <div className="logout-content">
          <div>{isLoggingOut ? 'Signing out...' : 'Redirecting to login...'}</div>
        </div>
      </div>
    </div>
  );
}
