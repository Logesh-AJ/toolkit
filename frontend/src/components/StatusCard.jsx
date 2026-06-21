import { motion } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiDownload, FiLoader } from 'react-icons/fi'
import styles from './StatusCard.module.css'

// status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
export default function StatusCard({ status, message, downloadUrl, downloadName, onReset }) {
  if (status === 'idle') return null

  return (
    <motion.div
      className={`${styles.card} ${styles[status]}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(status === 'uploading' || status === 'processing') && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className={styles.icon}
        >
          <FiLoader size={22} />
        </motion.div>
      )}
      {status === 'success' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={styles.icon}
        >
          <FiCheckCircle size={22} />
        </motion.div>
      )}
      {status === 'error' && (
        <div className={styles.icon}>
          <FiAlertCircle size={22} />
        </div>
      )}

      <div className={styles.text}>
        <p className={styles.message}>{message}</p>
      </div>

      {status === 'success' && downloadUrl && (
        <a
          href={downloadUrl}
          download={downloadName}
          className={styles.downloadBtn}
        >
          <FiDownload size={16} /> Download
        </a>
      )}

      {(status === 'success' || status === 'error') && onReset && (
        <button className={styles.resetBtn} onClick={onReset}>
          Start over
        </button>
      )}
    </motion.div>
  )
}