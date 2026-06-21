import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import StatusCard from '../components/StatusCard.jsx'
import { api, getDownloadUrl } from '../services/api.js'
import { getToolBySlug } from '../data/tools.js'
import { useRecentTools } from '../hooks/useRecentTools.js'
import styles from '../components/ToolPageLayout.module.css'

export default function QrGeneratorPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('qr-generator')
  const [text, setText] = useState('')
  const [fillColor, setFillColor] = useState('#0f0f1a')
  const [backColor, setBackColor] = useState('#ffffff')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const { addRecentTool } = useRecentTools()

  const Icon = tool.icon

  const handleGenerate = async () => {
    if (!text.trim()) return toast.error('Please enter text or a URL')

    setStatus('processing')
    setMessage('Generating QR code…')

    try {
      const formData = new FormData()
      formData.append('data', text)
      formData.append('fill_color', fillColor)
      formData.append('back_color', backColor)

      const { data } = await api.post('/api/qr/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const url = getDownloadUrl(data.download_url)
      setStatus('success')
      setMessage(data.message)
      setDownloadUrl(url)
      setPreviewUrl(url)
      addRecentTool(tool.slug)
      toast.success('QR code ready')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message
      setMessage(errMsg)
      toast.error(errMsg)
    }
  }

  const handleReset = () => {
    setText('')
    setStatus('idle')
    setMessage('')
    setDownloadUrl(null)
    setPreviewUrl(null)
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
            {previewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <img
                  src={previewUrl}
                  alt="Generated QR code"
                  style={{ width: 220, height: 220, borderRadius: 12, border: '1px solid var(--border)', background: '#fff', padding: 12 }}
                />
                <StatusCard
                  status="success"
                  message={message}
                  downloadUrl={downloadUrl}
                  downloadName="qrcode.png"
                  onReset={handleReset}
                />
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
                    Text or URL
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="https://example.com"
                    rows={3}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Foreground</label>
                    <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--border)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Background</label>
                    <input type="color" value={backColor} onChange={(e) => setBackColor(e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--border)' }} />
                  </div>
                </div>

                <StatusCard status={status} message={message} onReset={status === 'error' ? handleReset : undefined} />

                {status !== 'processing' && (
                  <button className={styles.processBtn} onClick={handleGenerate} disabled={!text.trim()}>
                    Generate QR code
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}