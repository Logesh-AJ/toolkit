import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './ToolCard.module.css'

export default function ToolCard({ tool, index = 0 }) {
  const Icon = tool.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link to={`/tool/${tool.slug}`} className={styles.card}>
        {tool.popular && <span className={styles.badge}>Popular</span>}
        <div className={styles.iconWrap}>
          <Icon size={22} />
        </div>
        <h3 className={styles.name}>{tool.name}</h3>
        <p className={styles.desc}>{tool.desc}</p>
        <span className={styles.formats}>{tool.formats.join(' · ')}</span>
      </Link>
    </motion.div>
  )
}