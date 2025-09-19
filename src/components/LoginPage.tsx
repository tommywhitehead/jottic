import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import svgPaths from "../imports/svg-4qeuqv3u0r";

function JotticLogo() {
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    navigate('/');
  };
  
  return (
    <div className="logo" data-name="Jottic" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
      <svg className="logo-svg" fill="none" preserveAspectRatio="none" viewBox="0 0 50 13">
        <g id="Jottic">
          <path d={svgPaths.p1c133f80} fill="var(--fill-0, #464646)" id="Vector" />
          <path d={svgPaths.p16897f80} fill="var(--fill-0, #464646)" id="Vector_2" />
          <path d={svgPaths.p7476d00} fill="var(--fill-0, #464646)" id="Vector_3" />
          <path d={svgPaths.p1ac03e00} fill="var(--fill-0, #464646)" id="Vector_4" />
          <path d={svgPaths.p2eac9c00} fill="var(--fill-0, #464646)" id="Vector_5" />
          <path d={svgPaths.p7638900} fill="var(--fill-0, #464646)" id="Vector_6" />
        </g>
      </svg>
    </div>
  );
}

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
