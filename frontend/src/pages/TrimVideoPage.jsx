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

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TrimVideoPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('trim-video')
  const [files, setFiles] = useState([])
  const [stage, setStage] = useState('upload') // upload | range | done
  const [duration, setDuration] = useState(0)
  const [uploadToken, setUploadToken] = useState(null)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState(null)
  const { addRecentTool } = useRecentTools()

  const Icon = tool.icon

  const handleProbe = async () => {
    if (!files.length) return toast.error('Please upload a video')

    setStatus('processing')
    setMessage('Reading video info…')

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      const { data } = await api.post('/api/video/probe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setDuration(data.duration_seconds)
      setUploadToken(data.upload_token)
      setStart(0)
      setEnd(data.duration_seconds)
      setStage('range')
      setStatus('idle')
      setMessage('')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message
      setMessage(errMsg)
      toast.error(errMsg)
    }
  }

  const handleTrim = async () => {
    setStatus('processing')
    setMessage('Trimming your video…')

    try {
      const formData = new FormData()
      formData.append('upload_token', uploadToken)
      formData.append('start_seconds', start)
      formData.append('end_seconds', end)

      const { data } = await api.post('/api/video/trim', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setStatus('success')
      setMessage(data.message)
      setDownloadUrl(getDownloadUrl(data.download_url))
      setDownloadName(data.filename)
      setStage('done')
      addRecentTool(tool.slug)
      toast.success('Trimmed successfully')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message
      setMessage(errMsg)
      toast.error(errMsg)
    }
  }

  const handleReset = () => {
    setFiles([])
    setStage('upload')
    setDuration(0)
    setUploadToken(null)
    setStart(0)
    setEnd(0)
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
            {stage === 'upload' && (
              <>
                <UploadZone
                  accept={{ 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'] }}
                  onFilesSelected={setFiles}
                />
                <StatusCard status={status} message={message} onReset={status === 'error' ? handleReset : undefined} />
                {status !== 'processing' && (
                  <button className={styles.processBtn} onClick={handleProbe} disabled={!files.length}>
                    Load video
                  </button>
                )}
              </>
            )}

            {stage === 'range' && (
              <>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Total duration: {formatTime(duration)}
                </div>

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    <span>Start</span><span>{formatTime(start)}</span>
                  </label>
                  <input
                    type="range" min="0" max={duration} step="0.5"
                    value={start}
                    onChange={(e) => setStart(Math.min(Number(e.target.value), end - 0.5))}
                    style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    <span>End</span><span>{formatTime(end)}</span>
                  </label>
                  <input
                    type="range" min="0" max={duration} step="0.5"
                    value={end}
                    onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 0.5))}
                    style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
                  />
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Clip length: {formatTime(end - start)}
                </p>

                <StatusCard status={status} message={message} />

                {status !== 'processing' && (
                  <button className={styles.processBtn} onClick={handleTrim}>
                    Trim video
                  </button>
                )}
              </>
            )}

            {stage === 'done' && (
              <StatusCard
                status="success"
                message={message}
                downloadUrl={downloadUrl}
                downloadName={downloadName}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
