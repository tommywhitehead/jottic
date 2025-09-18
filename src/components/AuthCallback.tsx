import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/');
          return;
        }

        if (data.session) {
          // Successfully authenticated, redirect to home
          navigate('/');
        } else {
          // No session, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'monospace'
    }}>
      <div>Completing authentication...</div>
    </div>
  );
}
