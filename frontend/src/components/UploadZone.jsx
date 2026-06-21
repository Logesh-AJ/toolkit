import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './UploadZone.module.css'

const MAX_SIZE_MB = 100

export default function UploadZone({ accept, multiple = false, onFilesSelected }) {
  const [files, setFiles] = useState([])

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles?.length) {
      rejectedFiles.forEach((rejection) => {
        const reason = rejection.errors[0]?.message || 'File rejected'
        toast.error(`${rejection.file.name}: ${reason}`)
      })
    }
    if (acceptedFiles.length) {
      const updated = multiple ? [...files, ...acceptedFiles] : acceptedFiles
      setFiles(updated)
      onFilesSelected?.(updated)
    }
  }, [files, multiple, onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
  })

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFilesSelected?.(updated)
  }

  return (
    <div className={styles.wrapper}>
      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ y: isDragActive ? -6 : 0, scale: isDragActive ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={styles.iconCircle}
        >
          <FiUploadCloud size={28} />
        </motion.div>
        <p className={styles.primaryText}>
          {isDragActive ? 'Drop it right here' : 'Drag & drop your file, or click to browse'}
        </p>
        <p className={styles.secondaryText}>Max file size {MAX_SIZE_MB}MB</p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul
            className={styles.fileList}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {files.map((file, i) => (
              <motion.li
                key={`${file.name}-${i}`}
                className={styles.fileItem}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <FiFile size={16} />
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${file.name}`}
                >
                  <FiX size={14} />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}