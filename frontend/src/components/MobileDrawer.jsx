import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { useEffect } from 'react'
import styles from './MobileDrawer.module.css'

export default function MobileDrawer({ isOpen, onClose }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleLinkClick = (e, href) => {
    e.preventDefault()
    onClose()
    // Wait for drawer close animation before scrolling
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.header}>
              <span className={styles.title}>Menu</span>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
                <FiX size={20} />
              </button>
            </div>

            <nav className={styles.nav}>
              <a href="#tools" className={styles.link} onClick={(e) => handleLinkClick(e, '#tools')}>
                Tools
              </a>
              <a href="#how-it-works" className={styles.link} onClick={(e) => handleLinkClick(e, '#how-it-works')}>
                How it works
              </a>
              <a href="#faq" className={styles.link} onClick={(e) => handleLinkClick(e, '#faq')}>
                FAQ
              </a>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}