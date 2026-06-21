import { motion } from 'framer-motion'
import { FiArrowRight, FiShield, FiZap } from 'react-icons/fi'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <motion.span
          className={styles.eyebrow}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          25 tools · 0 installs · 0 accounts
        </motion.span>

        <motion.h1
          className={styles.headline}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Your entire file toolkit,<br />in one workbench.
        </motion.h1>

        <motion.p
          className={styles.subheadline}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Convert, compress, merge, and edit PDFs, images, video, and audio —
          right in your browser. Nothing installed, nothing stored.
        </motion.p>

        <motion.div
          className={styles.ctaRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <a href="#tools" className={styles.primaryCta}>
            Browse all tools <FiArrowRight size={16} />
          </a>
          <div className={styles.trustPill}>
            <FiShield size={14} /> Files auto-deleted in 30 min
          </div>
        </motion.div>

        <motion.div
          className={styles.statsRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div className={styles.stat}>
            <FiZap size={16} />
            <span>Processing starts in seconds, not minutes</span>
          </div>
        </motion.div>
      </div>

      <div className={styles.glow} aria-hidden="true" />
    </section>
  )
}