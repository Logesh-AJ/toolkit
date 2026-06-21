import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiX, FiMove } from 'react-icons/fi'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import UploadZone from '../components/UploadZone.jsx'
import StatusCard from '../components/StatusCard.jsx'
import { api, getDownloadUrl } from '../services/api.js'
import { getToolBySlug } from '../data/tools.js'
import { useRecentTools } from '../hooks/useRecentTools.js'
import styles from '../components/ToolPageLayout.module.css'

export default function ReorderPdfPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('reorder-pdf')
  const [files, setFiles] = useState([])
  const [stage, setStage] = useState('upload') // upload | arrange | done
  const [pages, setPages] = useState([]) // array of original page numbers, reorderable
  const [uploadToken, setUploadToken] = useState(null)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState(null)
  const { addRecentTool } = useRecentTools()

  const Icon = tool.icon

  const handleProbe = async () => {
    if (!files.length) return toast.error('Please upload a PDF')

    setStatus('processing')
    setMessage('Reading page count…')

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      const { data } = await api.post('/api/pdf/page-count', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setPages(Array.from({ length: data.page_count }, (_, i) => i + 1))
      setUploadToken(data.upload_token)
      setStage('arrange')
      setStatus('idle')
      setMessage('')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message
      setMessage(errMsg)
      toast.error(errMsg)
    }
  }

  const handleDeletePage = (pageNum) => {
    if (pages.length <= 1) {
      toast.error('A PDF needs at least 1 page')
      return
    }
    setPages((prev) => prev.filter((p) => p !== pageNum))
  }

  const handleSubmit = async () => {
    if (!pages.length) return toast.error('At least 1 page must remain')

    setStatus('processing')
    setMessage('Saving your reordered PDF…')

    try {
      const formData = new FormData()
      formData.append('upload_token', uploadToken)
      formData.append('page_order', JSON.stringify(pages))

      const { data } = await api.post('/api/pdf/reorder', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setStatus('success')
      setMessage(data.message)
      setDownloadUrl(getDownloadUrl(data.download_url))
      setDownloadName(data.filename)
      setStage('done')
      addRecentTool(tool.slug)
      toast.success('PDF saved')
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
    setPages([])
    setUploadToken(null)
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

          <div className={`${styles.panel} glass-surface`}>
            {stage === 'upload' && (
              <>
                <UploadZone accept={{ 'application/pdf': ['.pdf'] }} onFilesSelected={setFiles} />
                <StatusCard status={status} message={message} onReset={status === 'error' ? handleReset : undefined} />
                {status !== 'processing' && (
                  <button className={styles.processBtn} onClick={handleProbe} disabled={!files.length}>
                    Load pages
                  </button>
                )}
              </>
            )}

            {stage === 'arrange' && (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Drag to reorder · click × to delete a page
                </p>

                <Reorder.Group
                  axis="y"
                  values={pages}
                  onReorder={setPages}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}
                >
                  {pages.map((pageNum, idx) => (
                    <Reorder.Item
                      key={pageNum}
                      value={pageNum}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 10,
                        border: '1px solid var(--border)', background: 'var(--bg-subtle)',
                        cursor: 'grab',
                      }}
                      whileDrag={{ scale: 1.02, boxShadow: 'var(--shadow-lg)' }}
                    >
                      <FiMove size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Position {idx + 1}</span>
                      <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Original page {pageNum}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePage(pageNum)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 26, height: 26, borderRadius: '50%',
                          background: 'transparent', color: 'var(--text-muted)',
                        }}
                        aria-label={`Delete page ${pageNum}`}
                      >
                        <FiX size={14} />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                <StatusCard status={status} message={message} />

                {status !== 'processing' && (
                  <button className={styles.processBtn} onClick={handleSubmit}>
                    Save PDF ({pages.length} page{pages.length !== 1 ? 's' : ''})
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