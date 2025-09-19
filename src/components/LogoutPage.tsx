import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LogoutPage() {
  const { signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        // Clear any stored intended URL
        sessionStorage.removeItem('intendedUrl');
        // Redirect to login page
        navigate('/login', { replace: true });
      } catch (error) {
        console.error('Error during logout:', error);
        // Even if logout fails, redirect to login
        navigate('/login', { replace: true });
      }
    };

    handleLogout();
  }, [signOut, navigate]);

  return (
    <div className="logout-page">
      <div className="logout-container">
        <div className="logout-content">
          <div>Signing out...</div>
        </div>
      </div>
    </div>
  );
}
