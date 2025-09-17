import { useState, useEffect, useCallback } from 'react'
import { supabase, Note } from '../lib/supabase'

export function useNotes(title: string) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load note by title
  const loadNote = useCallback(async () => {
    if (!title || title === 'home') return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('title', title)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      setNote(data || null)
    } catch (err) {
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
      if (note) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', note.id)
          .select()
          .single()

        if (error) throw error
        setNote(data)
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({ title, content })
          .select()
          .single()

        if (error) throw error
        setNote(data)
      }
    } catch (err) {
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
