import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage.jsx'

// Theme persistence
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('toolforge-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('toolforge-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return { theme, toggleTheme }
}

export default function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Routes>
      <Route path="/" element={<HomePage theme={theme} toggleTheme={toggleTheme} />} />
      {/* Tool routes will be added in Phase 4+ */}
    </Routes>
  )
}