import React from 'react';
import { useNavigate } from 'react-router-dom';
import svgPaths from "../imports/svg-4qeuqv3u0r";

export function JotticLogo() {
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    // Clicking the logo should clear the UI and then create a fresh note.
    // We first navigate to root, which App redirects to a new unused id.
    // Clear any per-note draft to avoid leaking content between notes.
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith('draft-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch (_) {
      // ignore
    }
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
