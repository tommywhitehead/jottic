import React from 'react';

interface EscCloseIndicatorProps {
  isVisible: boolean;
  progress: number;
  position: { x: number; y: number };
}

export function EscCloseIndicator({ isVisible, progress, position }: EscCloseIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="esc-close-indicator"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="esc-close-circle">
        <svg width="60" height="60" viewBox="0 0 60 60">
          {/* Background circle */}
          <circle
            cx="30"
            cy="30"
            r="28"
            fill="none"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="30"
            cy="30"
            r="28"
            fill="none"
            stroke="#464646"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
            transform="rotate(-90 30 30)"
            style={{
              transition: 'stroke-dashoffset 0.1s ease-out',
            }}
          />
        </svg>
        <div className="esc-close-text">
          close
        </div>
      </div>
    </div>
  );
}
