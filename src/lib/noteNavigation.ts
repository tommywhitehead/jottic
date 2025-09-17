import { useNavigate, useLocation } from 'react-router-dom';

// Utility function to get current note titles from URL
export function getCurrentNoteTitles(): string[] {
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    return [];
  }
  return path.substring(1).split('/').filter(segment => segment.length > 0);
}

// Utility function to check if a note already exists in the current URL
export function noteExistsInUrl(noteName: string): boolean {
  const currentNotes = getCurrentNoteTitles();
  return currentNotes.includes(noteName);
}

// Utility function to append a note to the current URL
export function appendNoteToUrl(noteName: string): string {
  const currentNotes = getCurrentNoteTitles();
  
  // If note already exists, don't add it again
  if (currentNotes.includes(noteName)) {
    return window.location.pathname;
  }
  
  // Add the new note to the end
  const newNotes = [...currentNotes, noteName];
  return `/${newNotes.join('/')}`;
}

// Utility function to navigate to a note (either append or focus existing)
export function navigateToNote(noteName: string, navigate: (path: string) => void) {
  const currentNotes = getCurrentNoteTitles();
  
  if (currentNotes.includes(noteName)) {
    // Note already exists, just navigate to current URL (no change needed)
    // The existing note will be visible in the current view
    return;
  }
  
  // Append the new note to the URL
  const newUrl = appendNoteToUrl(noteName);
  navigate(newUrl);
}

// Hook for note navigation functionality
export function useNoteNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentNotes = getCurrentNoteTitles();
  
  const goToNote = (noteName: string) => {
    navigateToNote(noteName, navigate);
  };
  
  const noteExists = (noteName: string) => {
    return noteExistsInUrl(noteName);
  };
  
  return {
    currentNotes,
    goToNote,
    noteExists,
  };
}
