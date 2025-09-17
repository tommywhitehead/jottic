import { useState, useEffect, useCallback, useRef } from 'react';

interface UseEscCloseOptions {
  onClose: () => void;
  isActive: boolean;
  holdDuration?: number;
}

export function useEscClose({ onClose, isActive, holdDuration = 1500 }: UseEscCloseOptions) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const isActiveRef = useRef(isActive);
  const holdDurationRef = useRef(holdDuration);

  // Update refs when props change
  useEffect(() => {
    onCloseRef.current = onClose;
    isActiveRef.current = isActive;
    holdDurationRef.current = holdDuration;
  }, [onClose, isActive, holdDuration]);

  const startHold = useCallback(() => {
    if (!isActiveRef.current || isHoldingRef.current) return;
    
    isHoldingRef.current = true;
    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    
    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const newProgress = Math.min((elapsed / holdDurationRef.current) * 100, 100);
        setProgress(newProgress);
      }
    }, 16); // ~60fps
    
    // Set timeout to trigger close
    holdTimeoutRef.current = setTimeout(() => {
      onCloseRef.current();
      isHoldingRef.current = false;
      setIsHolding(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, holdDurationRef.current);
  }, []);

  const stopHold = useCallback(() => {
    if (!isHoldingRef.current) return;
    
    isHoldingRef.current = false;
    setIsHolding(false);
    setProgress(0);
    startTimeRef.current = null;
    
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    let keyDownTime: number | null = null;
    let keyUpTime: number | null = null;
    let isKeyDown = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActiveRef.current && !isHoldingRef.current && !isKeyDown) {
        event.preventDefault();
        isKeyDown = true;
        keyDownTime = Date.now();
        startHold();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isHoldingRef.current && isKeyDown) {
        event.preventDefault();
        isKeyDown = false;
        keyUpTime = Date.now();
        stopHold();
      }
    };

    // Also handle the case where the key is released outside the window
    const handleBlur = () => {
      if (isHoldingRef.current) {
        isKeyDown = false;
        stopHold();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      stopHold();
    };
  }, []);

  // Separate effect to handle isActive changes
  useEffect(() => {
    if (!isActive && isHoldingRef.current) {
      stopHold();
    }
  }, [isActive, stopHold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    isHolding,
    progress,
    startHold,
    stopHold
  };
}
