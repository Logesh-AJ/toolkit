import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import UploadZone from './UploadZone.jsx'
import ProgressBar from './ProgressBar.jsx'
import StatusCard from './StatusCard.jsx'
import { uploadFiles, getDownloadUrl } from '../services/api.js'
import { getToolEndpoint } from '../services/toolEndpoints.js'
import { useRecentTools } from '../hooks/useRecentTools.js'
import styles from './ToolPageLayout.module.css'

// Maps a file extension to a MIME type react-dropzone understands.
// Falls back to '*' (any) for formats we don't need to strictly gate client-side —
// the backend always re-validates regardless.
const EXTENSION_MIME_MAP = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
}

function buildAcceptMap(formats) {
  if (!formats || formats[0] === 'any' || formats[0] === 'text/url') return undefined

  const acceptMap = {}
  formats.forEach((ext) => {
    const mime = EXTENSION_MIME_MAP[ext]
    if (mime) {
      acceptMap[mime] = acceptMap[mime] ? [...acceptMap[mime], ext] : [ext]
    }
  })
  return Object.keys(acceptMap).length ? acceptMap : undefined
}

/**
 * Generic tool page shell.
 *
 * @param {object} tool - entry from data/tools.js
 * @param {string} theme / {function} toggleTheme - lifted theme state
 * @param {object} extraFields - optional extra form fields to send (e.g. { quality: 80 })
 * @param {React.ReactNode} extraControls - optional custom inputs rendered above the upload zone
 * @param {object} acceptOverride - optional react-dropzone `accept` object override
 */
export default function ToolPageLayout({
  tool,
  theme,
  toggleTheme,
  extraFields = {},
  extraControls = null,
  acceptOverride = null,
}) {
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle') // idle | uploading | processing | success | error
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState(null)
  const { addRecentTool } = useRecentTools()

  const config = getToolEndpoint(tool.slug)
  const accept = acceptOverride ?? buildAcceptMap(tool.formats)

  const handleReset = useCallback(() => {
    setFiles([])
    setStatus('idle')
    setProgress(0)
    setMessage('')
    setDownloadUrl(null)
    setDownloadName(null)
  }, [])

  const handleProcess = async () => {
    if (!files.length) {
      toast.error('Please select a file first')
      return
    }
    if (!config) {
      toast.error('This tool is coming soon')
      return
    }

    setStatus('uploading')
    setProgress(0)
    setMessage('Uploading your file…')

    try {
      const data = await uploadFiles(config.endpoint, files, extraFields, (pct) => {
        setProgress(pct)
        if (pct === 100) {
          setStatus('processing')
          setMessage('Processing…')
        }
      })

      setStatus('success')
      setMessage(data.message || 'Done! Your file is ready.')
      setDownloadUrl(getDownloadUrl(data.download_url))
      setDownloadName(data.filename || 'download')
      addRecentTool(tool.slug)
      toast.success('Conversion complete')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message || 'Something went wrong'
      setMessage(errMsg)
      toast.error(errMsg)
    }
  }

  const Icon = tool.icon

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
            {extraControls}

            <UploadZone
              accept={accept}
              multiple={config?.multiple}
              onFilesSelected={setFiles}
            />

            {status === 'uploading' && (
              <ProgressBar percent={progress} label="Uploading" />
            )}

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
                disabled={!files.length}
              >
                Process file
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}