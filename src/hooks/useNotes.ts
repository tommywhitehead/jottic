import { useState, useEffect, useCallback } from 'react'
import { supabase, Note } from '../lib/supabase'

export function useNotes(title: string) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug: Track hook usage
  console.log('useNotes hook called for title:', title);

  // Load note by title
  const loadNote = useCallback(async () => {
    if (!title || title === 'home') return

    setLoading(true)
    setError(null)

    try {
      // Ensure we have a valid session before making the request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No valid Supabase session for notes query:', sessionError);
        setError('Not authenticated');
        return;
      }

      console.log('Making Supabase query for title:', title, 'with session:', !!session);
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('title', title)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Supabase query error:', error);
        throw error
      }

      setNote(data || null)
    } catch (err) {
      console.error('Notes query failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load note')
    } finally {
      setLoading(false)
    }
  }, [title])

  // Save note
  const saveNote = useCallback(async (content: string) => {
    if (!title || title === 'home') return

    setSaving(true)
    setError(null)

    try {
      // Ensure we have a valid session before making the request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No valid Supabase session for notes save:', sessionError);
        setError('Not authenticated');
        return;
      }

      // First, check if a note with this title already exists
      const { data: existingNote, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('title', title)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing note:', fetchError);
        throw fetchError
      }

      if (existingNote) {
        // Update existing note
        console.log('Updating existing note:', existingNote.id);
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
        setNote(data)
      } else {
        // Create new note
        console.log('Creating new note for title:', title);
        const { data, error } = await supabase
          .from('notes')
          .insert({ title, content })
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error:', error);
          throw error
        }
        setNote(data)
      }
    } catch (err) {
      console.error('Notes save failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }, [title, note])

  // Auto-save with debouncing
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const debouncedSave = useCallback((content: string) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    const timeout = setTimeout(() => {
      saveNote(content)
    }, 1000) // Save after 1 second of inactivity

    setSaveTimeout(timeout)
  }, [saveNote, saveTimeout])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

  // Load note when title changes
  useEffect(() => {
    loadNote()
  }, [loadNote])

  return {
    note,
    loading,
    saving,
    error,
    saveNote: debouncedSave,
    loadNote
  }
}
