import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage.jsx'
import ToolPage from './pages/ToolPage.jsx'
import ProtectPdfPage from './pages/ProtectPdfPage.jsx'
import UnlockPdfPage from './pages/UnlockPdfPage.jsx'
import SignPdfPage from './pages/SignPdfPage.jsx'
import FillPdfPage from './pages/FillPdfPage.jsx'
import OcrPdfPage from './pages/OcrPdfPage.jsx'
import CompressImagePage from './pages/CompressImagePage.jsx'
import ConvertImagePage from './pages/ConvertImagePage.jsx'
import ResizeImagePage from './pages/ResizeImagePage.jsx'
import ConvertVideoPage from './pages/ConvertVideoPage.jsx'
import CompressVideoPage from './pages/CompressVideoPage.jsx'
import TrimVideoPage from './pages/TrimVideoPage.jsx'
import ConvertAudioPage from './pages/ConvertAudioPage.jsx'
import QrGeneratorPage from './pages/QrGeneratorPage.jsx'
import ZipFilesPage from './pages/ZipFilesPage.jsx'
import ReorderPdfPage from './pages/ReorderPdfPage.jsx'

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('toolforge-theme')
    if (saved) return saved
    // Dark-first default per design brief; OS light-mode users can still toggle freely
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('toolforge-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return { theme, toggleTheme }
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const themeProps = { theme, toggleTheme }

  return (
    <Routes>
      <Route path="/" element={<HomePage {...themeProps} />} />

      {/* PDF tools needing custom UI */}
      <Route path="/tool/protect-pdf" element={<ProtectPdfPage {...themeProps} />} />
      <Route path="/tool/unlock-pdf" element={<UnlockPdfPage {...themeProps} />} />
      <Route path="/tool/sign-pdf" element={<SignPdfPage {...themeProps} />} />
      <Route path="/tool/fill-pdf" element={<FillPdfPage {...themeProps} />} />
      <Route path="/tool/ocr-pdf" element={<OcrPdfPage {...themeProps} />} />
      <Route path="/tool/reorder-pdf" element={<ReorderPdfPage {...themeProps} />} />

      {/* Image tools needing custom UI */}
      <Route path="/tool/compress-image" element={<CompressImagePage {...themeProps} />} />
      <Route path="/tool/convert-image" element={<ConvertImagePage {...themeProps} />} />
      <Route path="/tool/resize-image" element={<ResizeImagePage {...themeProps} />} />

      {/* Video/audio tools needing custom UI */}
      <Route path="/tool/convert-video" element={<ConvertVideoPage {...themeProps} />} />
      <Route path="/tool/compress-video" element={<CompressVideoPage {...themeProps} />} />
      <Route path="/tool/trim-video" element={<TrimVideoPage {...themeProps} />} />
      <Route path="/tool/convert-audio" element={<ConvertAudioPage {...themeProps} />} />

      {/* Utility tools needing custom UI */}
      <Route path="/tool/qr-generator" element={<QrGeneratorPage {...themeProps} />} />
      <Route path="/tool/zip-files" element={<ZipFilesPage {...themeProps} />} />

      {/* Generic layout for every other tool */}
      <Route path="/tool/:slug" element={<ToolPage {...themeProps} />} />
    </Routes>
  )
}