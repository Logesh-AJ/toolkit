import { useState, useMemo } from 'react'
import { TOOLS, TOOL_CATEGORIES } from '../data/tools.js'
import ToolCard from './ToolCard.jsx'
import styles from './ToolGrid.module.css'

export default function ToolGrid() {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredTools = useMemo(() => {
    if (activeCategory === 'all') return TOOLS
    return TOOLS.filter((t) => t.category === activeCategory)
  }, [activeCategory])

  return (
    <section id="tools" className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>All tools</h2>
          <p className={styles.subtitle}>Pick a tool, drop a file, done.</p>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            className={`${styles.tab} ${activeCategory === 'all' ? styles.tabActive : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.tab} ${activeCategory === cat.id ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filteredTools.map((tool, i) => (
            <ToolCard key={tool.slug} tool={tool} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}