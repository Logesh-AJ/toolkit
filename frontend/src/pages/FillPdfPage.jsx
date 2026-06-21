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

export default function FillPdfPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('fill-pdf')
  const [files, setFiles] = useState([])
  const [stage, setStage] = useState('upload') // upload | fields | done
  const [fields, setFields] = useState([])
  const [values, setValues] = useState({})
  const [uploadToken, setUploadToken] = useState(null)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState(null)
  const { addRecentTool } = useRecentTools()

  const Icon = tool.icon

  const handleInspect = async () => {
    if (!files.length) return toast.error('Please upload a PDF')

    setStatus('processing')
    setMessage('Scanning for form fields…')

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      const { data } = await api.post('/api/pdf/fill/inspect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (!data.has_fields) {
        setStatus('error')
        setMessage('No fillable form fields were found in this PDF')
        toast.error('No fillable fields detected')
        return
      }

      setFields(data.fields)
      setUploadToken(data.upload_token)
      setValues(Object.fromEntries(data.fields.map((f) => [f.field_id, f.value || ''])))
      setStage('fields')
      setStatus('idle')
      setMessage('')
    } catch (err) {
      setStatus('error')
      const errMsg = err.response?.data?.error || err.message
      setMessage(errMsg)
      toast.error(errMsg)
    }
  }

  const handleSubmit = async () => {
    setStatus('processing')
    setMessage('Filling your form…')

    try {
      const formData = new FormData()
      formData.append('upload_token', uploadToken)
      formData.append('field_values', JSON.stringify(values))

      const { data } = await api.post('/api/pdf/fill', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setStatus('success')
      setMessage(data.message)
      setDownloadUrl(getDownloadUrl(data.download_url))
      setDownloadName(data.filename)
      setStage('done')
      addRecentTool(tool.slug)
      toast.success('Form filled')
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
    setFields([])
    setValues({})
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

          <div className={styles.panel}>
            {stage === 'upload' && (
              <>
                <UploadZone accept={{ 'application/pdf': ['.pdf'] }} onFilesSelected={setFiles} />
                <StatusCard status={status} message={message} onReset={status === 'error' ? handleReset : undefined} />
                {status !== 'processing' && (
                  <button className={styles.processBtn} onClick={handleInspect} disabled={!files.length}>
                    Detect form fields
                  </button>
                )}
              </>
            )}

            {stage === 'fields' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {fields.map((field) => (
                    <div key={field.field_id}>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                        {field.field_id}
                      </label>
                      {field.type === 'choice' && field.options ? (
                        <select
                          value={values[field.field_id] || ''}
                          onChange={(e) => setValues((v) => ({ ...v, [field.field_id]: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
                        >
                          <option value="">Select…</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={values[field.field_id] || ''}
                          onChange={(e) => setValues((v) => ({ ...v, [field.field_id]: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <StatusCard status={status} message={message} />
                {status !== 'processing' && (
                  <button className={styles.processBtn} onClick={handleSubmit}>
                    Fill PDF
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