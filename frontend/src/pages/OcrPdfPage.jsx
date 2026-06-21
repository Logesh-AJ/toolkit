import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiCopy, FiDownload } from 'react-icons/fi'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import UploadZone from '../components/UploadZone.jsx'
import StatusCard from '../components/StatusCard.jsx'
import { api } from '../services/api.js'
import { getToolBySlug } from '../data/tools.js'
import { useRecentTools } from '../hooks/useRecentTools.js'
import styles from '../components/ToolPageLayout.module.css'

export default function OcrPdfPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('ocr-pdf')
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [text, setText] = useState('')
  const { addRecentTool } = useRecentTools()

  const Icon = tool.icon

  const handleProcess = async () => {
    if (!files.length) return toast.error('Please upload a file')

    setStatus('processing')
    setMessage('Extracting text…')

    try {
      const formData = new FormData()
      formData.append('file', files[0])

      const { data } = await api.post('/api/pdf/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setStatus('success')
      setMessage(data.message)
      setText(data.text)
      addRecentTool(tool.slug)
      toast.success('Text extracted')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message
      setMessage(errMsg)
      toast.error(errMsg)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'extracted-text.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setFiles([])
    setStatus('idle')
    setMessage('')
    setText('')
  }

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className={styles.main}>
        <div className={`container ${styles.container}`}>
          <motion.div
            className={styles.header}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.iconWrap}><Icon size={26} /></div>
            <h1 className={styles.title}>{tool.name}</h1>
            <p className={styles.desc}>{tool.desc}</p>
            <span className={styles.formats}>Supports: {tool.formats.join(', ')}</span>
          </motion.div>

          <div className={styles.panel}>
            {!text && (
              <>
                <UploadZone
                  accept={{ 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
                  onFilesSelected={setFiles}
                />
                <StatusCard status={status} message={message} onReset={status === 'error' ? handleReset : undefined} />
                {status !== 'processing' && (
                  <button className={styles.processBtn} onClick={handleProcess} disabled={!files.length}>
                    Extract text
                  </button>
                )}
              </>
            )}

            {text && (
              <>
                <textarea
                  readOnly
                  value={text}
                  style={{
                    width: '100%',
                    minHeight: 300,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    fontFamily: 'monospace',
                  }}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className={styles.processBtn} onClick={handleCopy} style={{ flex: 1 }}>
                    <FiCopy size={16} style={{ marginRight: 6 }} /> Copy text
                  </button>
                  <button className={styles.processBtn} onClick={handleDownloadTxt} style={{ flex: 1 }}>
                    <FiDownload size={16} style={{ marginRight: 6 }} /> Download .txt
                  </button>
                </div>
                <button
                  onClick={handleReset}
                  style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}
                >
                  Start over
                </button>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}