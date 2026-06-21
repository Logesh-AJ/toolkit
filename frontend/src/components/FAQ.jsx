import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'
import styles from './FAQ.module.css'

const FAQS = [
  { q: 'Do I need to create an account?', a: 'No. Every tool works without signing up or logging in. Just upload your file and go.' },
  { q: 'What happens to my files after processing?', a: 'Uploaded and processed files are automatically and permanently deleted from our servers after 30 minutes.' },
  { q: 'Is there a file size limit?', a: 'Yes, each upload can be up to 100MB. Larger workflows may be split into batches.' },
  { q: 'Are the tools really free?', a: 'Yes, all 25 tools are free to use with no hidden limits on basic conversions.' },
  { q: 'Can I use ToolForge on my phone?', a: 'Yes, every tool is fully responsive and works in any modern mobile browser.' },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section id="faq" className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>Frequently asked questions</h2>
        <div className={styles.list}>
          {FAQS.map((item, i) => (
            <div key={item.q} className={styles.item}>
              <button
                className={styles.question}
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
              >
                {item.q}
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={styles.answerWrap}
                  >
                    <p className={styles.answer}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}