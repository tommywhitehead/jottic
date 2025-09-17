import { useState, useEffect, useRef } from 'react';

interface UseActivePaneOptions {
  leftPaneRef: React.RefObject<HTMLElement>;
  rightPaneRef: React.RefObject<HTMLElement>;
}

export function useActivePane({ leftPaneRef, rightPaneRef }: UseActivePaneOptions) {
  const [activePane, setActivePane] = useState<'left' | 'right' | null>(null);
  const lastActiveRef = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the focused element is within the left pane
      if (leftPaneRef.current && leftPaneRef.current.contains(target)) {
        setActivePane('left');
        lastActiveRef.current = 'left';
      }
      // Check if the focused element is within the right pane
      else if (rightPaneRef.current && rightPaneRef.current.contains(target)) {
        setActivePane('right');
        lastActiveRef.current = 'right';
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      // Only clear active pane if focus is moving completely outside both panes
      const target = event.target as HTMLElement;
      const relatedTarget = event.relatedTarget as HTMLElement;
      
      // If focus is moving to another element within the same pane, keep it active
      if (activePane === 'left' && leftPaneRef.current && leftPaneRef.current.contains(relatedTarget)) {
        return;
      }
      if (activePane === 'right' && rightPaneRef.current && rightPaneRef.current.contains(relatedTarget)) {
        return;
      }
      
      // If focus is moving outside both panes, clear active pane
      if (leftPaneRef.current && !leftPaneRef.current.contains(relatedTarget) &&
          rightPaneRef.current && !rightPaneRef.current.contains(relatedTarget)) {
        setActivePane(null);
      }
    };

    // Add focus listeners to both panes
    if (leftPaneRef.current) {
      leftPaneRef.current.addEventListener('focusin', handleFocusIn);
      leftPaneRef.current.addEventListener('focusout', handleFocusOut);
    }
    
    if (rightPaneRef.current) {
      rightPaneRef.current.addEventListener('focusin', handleFocusIn);
      rightPaneRef.current.addEventListener('focusout', handleFocusOut);
    }

    return () => {
      if (leftPaneRef.current) {
        leftPaneRef.current.removeEventListener('focusin', handleFocusIn);
        leftPaneRef.current.removeEventListener('focusout', handleFocusOut);
      }
      
      if (rightPaneRef.current) {
        rightPaneRef.current.removeEventListener('focusin', handleFocusIn);
        rightPaneRef.current.removeEventListener('focusout', handleFocusOut);
      }
    };
  }, [leftPaneRef, rightPaneRef, activePane]);

  // Get the last active pane if no pane is currently focused
  const getActivePane = () => {
    return activePane || lastActiveRef.current;
  };

  return {
    activePane: getActivePane(),
    isLeftActive: getActivePane() === 'left',
    isRightActive: getActivePane() === 'right',
  };
}
