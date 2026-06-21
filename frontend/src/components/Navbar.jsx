import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSun, FiMoon, FiTool, FiMenu } from 'react-icons/fi'
import { useScrollDirection } from '../hooks/useScrollDirection.js'
import MobileDrawer from './MobileDrawer.jsx'
import styles from './Navbar.module.css'

export default function Navbar({ theme, toggleTheme }) {
  const { isScrolled, hidden } = useScrollDirection()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleNavClick = (e, href) => {
    e.preventDefault()
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <motion.header
        className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}
        animate={{ y: hidden ? -80 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <div className={`container ${styles.inner}`}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}>
              <FiTool size={18} />
            </span>
            <span className={styles.logoText}>ToolForge</span>
          </Link>

          <nav className={styles.links}>
            <a href="#tools" className={styles.link} onClick={(e) => handleNavClick(e, '#tools')}>Tools</a>
            <a href="#how-it-works" className={styles.link} onClick={(e) => handleNavClick(e, '#how-it-works')}>How it works</a>
            <a href="#faq" className={styles.link} onClick={(e) => handleNavClick(e, '#faq')}>FAQ</a>
          </nav>

          <div className={styles.actions}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex' }}
              >
                {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
              </motion.span>
            </motion.button>

            <button
              className={styles.menuToggle}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <FiMenu size={20} />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}