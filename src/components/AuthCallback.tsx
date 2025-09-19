import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth state to be determined
    if (loading) return;

    if (user) {
      // Successfully authenticated, redirect to intended URL or home
      const intendedUrl = sessionStorage.getItem('intendedUrl');
      if (intendedUrl) {
        sessionStorage.removeItem('intendedUrl');
        navigate(intendedUrl, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      // No session, redirect to login
      navigate('/login');
    }
  }, [user, loading, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'monospace'
    }}>
      <div>{loading ? 'Completing authentication...' : 'Redirecting...'}</div>
    </div>
  );
}
