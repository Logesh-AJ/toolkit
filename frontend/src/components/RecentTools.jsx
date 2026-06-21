import { getToolBySlug } from '../data/tools.js'
import ToolCard from './ToolCard.jsx'
import styles from './ToolGrid.module.css'

export default function RecentTools({ recentSlugs }) {
  if (!recentSlugs?.length) return null

  const tools = recentSlugs.map(getToolBySlug).filter(Boolean)
  if (!tools.length) return null

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header} style={{ textAlign: 'left', marginBottom: '24px' }}>
          <h2 className={styles.title} style={{ fontSize: '1.4rem' }}>Recently used</h2>
        </div>
        <div className={styles.grid}>
          {tools.map((tool, i) => (
            <ToolCard key={tool.slug} tool={tool} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
