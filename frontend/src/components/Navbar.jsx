import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSun, FiMoon, FiTool } from 'react-icons/fi'
import styles from './Navbar.module.css'

export default function Navbar({ theme, toggleTheme }) {
  return (
    <header className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>
            <FiTool size={18} />
          </span>
          <span className={styles.logoText}>ToolForge</span>
        </Link>
        
        <nav className={styles.links}>
          <a href="#tools" className={styles.link}>Tools</a>
          <a href="#how-it-works" className={styles.link}>How it works</a>
          <a href="#faq" className={styles.link}>FAQ</a>
        </nav>

        <div className={styles.actions}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </motion.button>
        </div>
      </div>
    </header>
  )
}