import { FiTool, FiGithub, FiTwitter, FiMail } from 'react-icons/fi'
import styles from './Footer.module.css'

const FOOTER_LINKS = {
  Product: ['All Tools', 'Most Popular', 'How it works', 'Pricing'],
  Company: ['About', 'Privacy Policy', 'Terms of Service', 'Contact'],
  Resources: ['FAQ', 'Help Center', 'API Docs', 'Status'],
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span className={styles.logoMark}><FiTool size={16} /></span>
              <span className={styles.logoText}>ToolForge</span>
            </div>
            <p className={styles.tagline}>
              Twenty-five tools, one workbench. No installs, no accounts, no nonsense.
            </p>
            <div className={styles.social}>
              <a href="#" aria-label="GitHub"><FiGithub size={18} /></a>
              <a href="#" aria-label="Twitter"><FiTwitter size={18} /></a>
              <a href="#" aria-label="Email"><FiMail size={18} /></a>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading} className={styles.column}>
              <h4 className={styles.columnHeading}>{heading}</h4>
              <ul>
                {links.map((link) => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} ToolForge. All files processed are deleted automatically.</p>
        </div>
      </div>
    </footer>
  )
}