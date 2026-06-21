import { motion } from 'framer-motion'
import styles from './ProgressBar.module.css'

export default function ProgressBar({ percent = 0, label }) {
  return (
    <div className={styles.wrapper}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.track}>
        <motion.div
          className={styles.fill}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      <div className={styles.percent}>{percent}%</div>
    </div>
  )
}