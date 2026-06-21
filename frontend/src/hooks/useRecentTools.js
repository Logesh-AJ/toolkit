import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'toolforge-recent-tools'
const MAX_RECENT = 6

export function useRecentTools() {
  const [recentSlugs, setRecentSlugs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSlugs))
  }, [recentSlugs])

  const addRecentTool = useCallback((slug) => {
    setRecentSlugs((prev) => {
      const filtered = prev.filter((s) => s !== slug)
      return [slug, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

  return { recentSlugs, addRecentTool }
}