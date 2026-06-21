import { motion } from 'framer-motion'
import Skeleton from './Skeleton.jsx'
import styles from './ResultSkeleton.module.css'

export default function ResultSkeleton() {
  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Skeleton width="40px" height="40px" radius="50%" />
      <div className={styles.lines}>
        <Skeleton width="70%" height="13px" />
      </div>
      <Skeleton width="110px" height="38px" radius="8px" />
    </motion.div>
  )
}