import { motion } from 'framer-motion'
import styles from './ToolPageLayout.module.css'

export default function ToolPageHeader({ tool, subtitle }) {
  const Icon = tool.icon

  return (
    <motion.div
      className={styles.header}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className={styles.iconWrap}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
      >
        <Icon size={26} />
      </motion.div>
      <h1 className={styles.title}>{tool.name}</h1>
      <p className={styles.desc}>{tool.desc}</p>
      {subtitle && <span className={styles.formats}>{subtitle}</span>}
    </motion.div>
  )
}