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

export default function SignPdfPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('sign-pdf')
  const [pdfFiles, setPdfFiles] = useState([])
  const [signatureFiles, setSignatureFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState(null)
  const { addRecentTool } = useRecentTools()

  const Icon = tool.icon

  const handleReset = () => {
    setPdfFiles([])
    setSignatureFiles([])
    setStatus('idle')
    setMessage('')
    setDownloadUrl(null)
    setDownloadName(null)
  }

  const handleProcess = async () => {
    if (!pdfFiles.length) return toast.error('Please upload a PDF')
    if (!signatureFiles.length) return toast.error('Please upload a signature image')

    setStatus('processing')
    setMessage('Stamping your signature…')

    try {
      const formData = new FormData()
      formData.append('file', pdfFiles[0])
      formData.append('signature', signatureFiles[0])
      formData.append('page_number', 1)
      formData.append('x', 50)
      formData.append('y', 50)
      formData.append('width', 150)
      formData.append('height', 60)

      const { data } = await api.post('/api/pdf/sign', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setStatus('success')
      setMessage(data.message)
      setDownloadUrl(getDownloadUrl(data.download_url))
      setDownloadName(data.filename)
      addRecentTool(tool.slug)
      toast.success('Signed successfully')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message
      setMessage(errMsg)
      toast.error(errMsg)
    }
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
            <span className={styles.formats}>Signature is placed in the bottom-left of page 1</span>
          </motion.div>

          <div className={styles.panel}>
            <div>
              <p style={{ marginBottom: 8, fontWeight: 600, fontSize: '0.9rem' }}>1. Your PDF</p>
              <UploadZone accept={{ 'application/pdf': ['.pdf'] }} onFilesSelected={setPdfFiles} />
            </div>

            <div>
              <p style={{ marginBottom: 8, fontWeight: 600, fontSize: '0.9rem' }}>2. Signature image (PNG/JPG)</p>
              <UploadZone
                accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
                onFilesSelected={setSignatureFiles}
              />
            </div>

            <StatusCard
              status={status}
              message={message}
              downloadUrl={downloadUrl}
              downloadName={downloadName}
              onReset={handleReset}
            />

            {status === 'idle' && (
              <button
                className={styles.processBtn}
                onClick={handleProcess}
                disabled={!pdfFiles.length || !signatureFiles.length}
              >
                Sign PDF
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}