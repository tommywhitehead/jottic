import { useState, useEffect, useRef } from 'react';

interface UseMultiPaneOptions {
  paneRefs: React.RefObject<HTMLElement>[];
}

export function useMultiPane({ paneRefs }: UseMultiPaneOptions) {
  const [activePaneIndex, setActivePaneIndex] = useState<number | null>(null);
  const lastActiveRef = useRef<number | null>(null);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // Check which pane contains the focused element
      for (let i = 0; i < paneRefs.length; i++) {
        if (paneRefs[i].current && paneRefs[i].current.contains(target)) {
          setActivePaneIndex(i);
          lastActiveRef.current = i;
          return;
        }
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const relatedTarget = event.relatedTarget as HTMLElement;
      
      // If focus is moving to another element within the same pane, keep it active
      if (activePaneIndex !== null && paneRefs[activePaneIndex].current && 
          paneRefs[activePaneIndex].current.contains(relatedTarget)) {
        return;
      }
      
      // If focus is moving outside all panes, clear active pane
      let focusStillInPanes = false;
      for (let i = 0; i < paneRefs.length; i++) {
        if (paneRefs[i].current && paneRefs[i].current.contains(relatedTarget)) {
          focusStillInPanes = true;
          break;
        }
      }
      
      if (!focusStillInPanes) {
        setActivePaneIndex(null);
      }
    };

    // Add focus listeners to all panes
    paneRefs.forEach((paneRef, index) => {
      if (paneRef.current) {
        paneRef.current.addEventListener('focusin', handleFocusIn);
        paneRef.current.addEventListener('focusout', handleFocusOut);
      }
    });

    return () => {
      paneRefs.forEach((paneRef) => {
        if (paneRef.current) {
          paneRef.current.removeEventListener('focusin', handleFocusIn);
          paneRef.current.removeEventListener('focusout', handleFocusOut);
        }
      });
    };
  }, [paneRefs]);

  // Get the last active pane if no pane is currently focused
  const getActivePaneIndex = () => {
    return activePaneIndex !== null ? activePaneIndex : lastActiveRef.current;
  };

  const isPaneActive = (index: number) => {
    return getActivePaneIndex() === index;
  };

  return {
    activePaneIndex: getActivePaneIndex(),
    isPaneActive,
  };
}
