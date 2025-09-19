import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { JotticLogo } from './JotticLogo';

export function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If user is already logged in, redirect to intended destination
  React.useEffect(() => {
    if (!loading && user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [loading, user, location.state, navigate]);

  const handleLogin = async () => {
    // Store the intended destination from the location state or current path
    const intendedPath = location.state?.from?.pathname || location.pathname;
    if (intendedPath !== '/login') {
      // Store the intended URL in sessionStorage for after auth callback
      sessionStorage.setItem('intendedUrl', intendedPath);
    }
    await signInWithGoogle();
  };

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <JotticLogo />
          <div className="login-content">
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <JotticLogo />
        <div className="login-content">
          <h1>Welcome to Jottic</h1>
          <p>Sign in to access your collaborative notes</p>
          <button 
            className="login-button"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
