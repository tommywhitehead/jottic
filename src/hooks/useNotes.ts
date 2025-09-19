import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, Note } from '../lib/supabase'

interface NoteState {
  title: string
  value: Note | null
}

export function useNotes(title: string) {
  const [noteState, setNoteState] = useState<NoteState>({ title, value: null })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContentRef = useRef<string | null>(null)

  const note = noteState.title === title ? noteState.value : null

  // Load note by title
  const loadNote = useCallback(async () => {
    if (!title || title === 'home') return

    setLoading(true)
    setError(null)

    try {
      // Ensure we have a valid session before making the request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        if (isMountedRef.current) {
          console.error('No valid Supabase session for notes query:', sessionError);
          setError('Not authenticated');
        }
        return;
      }
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('title', title)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no record found

      if (error) {
        console.error('Supabase query error:', error);
        // Handle specific error codes
        if (error.code === 'PGRST116') {
          // No record found - this is expected for new notes
        } else if (error.status === 406) {
          console.error('406 Not Acceptable - possible RLS policy issue');
          if (isMountedRef.current) {
            setError('Access denied - check authentication');
          }
        } else {
          throw error;
        }
      }
      if (isMountedRef.current) {
        setNoteState({ title, value: data || null })
      }
    } catch (err) {
      console.error('Notes query failed:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load note')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [title])

  // Save note
  const saveNote = useCallback(async (content: string) => {
    if (!title || title === 'home') return

    if (isMountedRef.current) {
      setSaving(true)
      setError(null)
    }

    try {
      // Ensure we have a valid session before making the request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No valid Supabase session for notes save:', sessionError);
        if (isMountedRef.current) {
          setError('Not authenticated');
        }
        return;
      }

      // First, check if a note with this title already exists
      const { data: existingNote, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('title', title)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing note:', fetchError);
        throw fetchError
      }

      if (existingNote) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', existingNote.id)
          .select()
          .single()

        if (error) {
          console.error('Supabase update error:', error);
          throw error
        }
        if (isMountedRef.current) {
          setNoteState({ title, value: data })
        }
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({ title, content })
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error:', error);
          throw error
        }
        if (isMountedRef.current) {
          setNoteState({ title, value: data })
        }
      }
    } catch (err) {
      console.error('Notes save failed:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to save note')
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false)
      }
    }
  }, [title])

  const flushPendingSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    const pendingContent = latestContentRef.current
    latestContentRef.current = null

    if (pendingContent !== null) {
      try {
        await saveNote(pendingContent)
      } catch (error) {
        console.error('Failed to flush pending note save:', error)
      }
    }
  }, [saveNote])

  const debouncedSave = useCallback((content: string) => {
    latestContentRef.current = content

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null
      const pendingContent = latestContentRef.current
      latestContentRef.current = null
      if (pendingContent !== null) {
        void saveNote(pendingContent)
      }
    }, 1000)
  }, [saveNote])

  // Load note when title changes
  useEffect(() => {
    loadNote()
  }, [loadNote])

  useEffect(() => {
    return () => {
      void flushPendingSave()
    }
  }, [flushPendingSave, title])

  useEffect(() => {
    if (noteState.title !== title) {
      setNoteState({ title, value: null })
    }
    setError(null)
    latestContentRef.current = null
  }, [title])

  useEffect(() => () => {
    isMountedRef.current = false
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  return {
    note,
    loading,
    saving,
    error,
    saveNote: debouncedSave,
    flushPendingSave,
    loadNote
  }
}
