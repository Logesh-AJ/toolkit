import { useState } from 'react'
import { getToolBySlug } from '../data/tools.js'
import ToolPageLayout from '../components/ToolPageLayout.jsx'

export default function CompressImagePage({ theme, toggleTheme }) {
  const tool = getToolBySlug('compress-image')
  const [quality, setQuality] = useState(75)

  return (
    <ToolPageLayout
      tool={tool}
      theme={theme}
      toggleTheme={toggleTheme}
      extraFields={{ quality }}
      extraControls={
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            <span>Quality</span>
            <span style={{ color: 'var(--brand-primary)' }}>{quality}%</span>
          </label>
          <input
            type="range"
            min="10"
            max="95"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Lower quality means smaller file size
          </p>
        </div>
      }
    />
  )
}