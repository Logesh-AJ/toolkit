import { useState } from 'react'
import { getToolBySlug } from '../data/tools.js'
import ToolPageLayout from '../components/ToolPageLayout.jsx'

export default function ResizeImagePage({ theme, toggleTheme }) {
  const tool = getToolBySlug('resize-image')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
  }

  return (
    <ToolPageLayout
      tool={tool}
      theme={theme}
      toggleTheme={toggleTheme}
      extraFields={{ mode: 'resize', width: width || undefined, height: height || undefined }}
      extraControls={
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            Target dimensions (px) — leave one blank to keep aspect ratio
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="number"
              placeholder="Width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      }
    />
  )
}