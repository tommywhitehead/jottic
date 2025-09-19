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
        // Even if logout fails, clear storage and redirect to login
        sessionStorage.removeItem('intendedUrl');
        localStorage.removeItem('intendedUrl');
        
        // Force redirect using window.location
        window.location.href = '/login';
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
