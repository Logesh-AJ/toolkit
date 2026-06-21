import { motion } from 'framer-motion'
import { FiUserX, FiClock, FiLock, FiZap } from 'react-icons/fi'
import styles from './TrustSection.module.css'

const POINTS = [
  { icon: FiUserX, title: 'No registration', desc: 'Use every tool without creating an account.' },
  { icon: FiClock, title: 'Auto-deleted files', desc: 'Uploads and results are wiped after 30 minutes.' },
  { icon: FiLock, title: 'Privacy-first', desc: 'Files are processed in isolation, never shared.' },
  { icon: FiZap, title: 'Fast processing', desc: 'Most conversions finish in under 10 seconds.' },
]

export default function TrustSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {POINTS.map((point, i) => {
            const Icon = point.icon
            return (
              <motion.div
                key={point.title}
                className={styles.point}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <motion.div
                  className={styles.iconWrap}
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                >
                  <Icon size={20} />
                </motion.div>
                <h3>{point.title}</h3>
                <p>{point.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}