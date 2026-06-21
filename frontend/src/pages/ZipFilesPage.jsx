import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import UploadZone from '../components/UploadZone.jsx'
import StatusCard from '../components/StatusCard.jsx'
import { api, getDownloadUrl } from '../services/api.js'
import { getToolBySlug } from '../data/tools.js'
import { useRecentTools } from '../hooks/useRecentTools.js'
import styles from '../components/ToolPageLayout.module.css'

export default function ZipFilesPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('zip-files')
  const [mode, setMode] = useState('zip') // 'zip' | 'unzip'
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState(null)
  const { addRecentTool } = useRecentTools()

  const Icon = tool.icon

  const switchMode = (newMode) => {
    setMode(newMode)
    setFiles([])
    setStatus('idle')
    setMessage('')
    setDownloadUrl(null)
    setDownloadName(null)
  }

  const handleProcess = async () => {
    if (!files.length) return toast.error('Please select file(s) first')

    setStatus('processing')
    setMessage(mode === 'zip' ? 'Creating ZIP…' : 'Extracting archive…')

    try {
      const formData = new FormData()
      if (mode === 'zip') {
        files.forEach((f) => formData.append('files', f))
      } else {
        formData.append('file', files[0])
      }

      const endpoint = mode === 'zip' ? '/api/archive/zip' : '/api/archive/unzip'
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setStatus('success')
      setMessage(data.message)
      setDownloadUrl(getDownloadUrl(data.download_url))
      setDownloadName(data.filename)
      addRecentTool(tool.slug)
      toast.success('Done')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message
      setMessage(errMsg)
      toast.error(errMsg)
    }
  }

  const handleReset = () => {
    setFiles([])
    setStatus('idle')
    setMessage('')
    setDownloadUrl(null)
    setDownloadName(null)
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
          </motion.div>

          <div className={styles.panel}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => switchMode('zip')}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  border: `1px solid ${mode === 'zip' ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: mode === 'zip' ? 'var(--brand-gradient)' : 'var(--bg-subtle)',
                  color: mode === 'zip' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: '0.85rem',
                }}
              >
                Create ZIP
              </button>
              <button
                type="button"
                onClick={() => switchMode('unzip')}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  border: `1px solid ${mode === 'unzip' ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: mode === 'unzip' ? 'var(--brand-gradient)' : 'var(--bg-subtle)',
                  color: mode === 'unzip' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: '0.85rem',
                }}
              >
                Extract Archive
              </button>
            </div>

            {mode === 'unzip' && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Supports .zip and .rar — extracted files are bundled into a single ZIP for download
              </p>
            )}

            <UploadZone
              key={mode}
              accept={mode === 'unzip' ? { 'application/zip': ['.zip'], 'application/vnd.rar': ['.rar'] } : undefined}
              multiple={mode === 'zip'}
              onFilesSelected={setFiles}
            />

            <StatusCard
              status={status}
              message={message}
              downloadUrl={downloadUrl}
              downloadName={downloadName}
              onReset={handleReset}
            />

            {status === 'idle' && (
              <button className={styles.processBtn} onClick={handleProcess} disabled={!files.length}>
                {mode === 'zip' ? 'Create ZIP' : 'Extract'}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}