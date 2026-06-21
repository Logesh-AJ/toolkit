import { useState } from 'react'
import { getToolBySlug } from '../data/tools.js'
import ToolPageLayout from '../components/ToolPageLayout.jsx'

const LEVELS = [
  { id: 'low', label: 'Smaller file', sub: 'More compression' },
  { id: 'medium', label: 'Balanced', sub: 'Recommended' },
  { id: 'high', label: 'Higher quality', sub: 'Less compression' },
]

export default function CompressVideoPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('compress-video')
  const [level, setLevel] = useState('medium')

  return (
    <ToolPageLayout
      tool={tool}
      theme={theme}
      toggleTheme={toggleTheme}
      extraFields={{ level }}
      extraControls={
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            Compression level
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLevel(l.id)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  borderRadius: 8,
                  border: `1px solid ${level === l.id ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: level === l.id ? 'var(--brand-gradient)' : 'var(--bg-subtle)',
                  color: level === l.id ? '#fff' : 'var(--text-secondary)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{l.label}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: 2 }}>{l.sub}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Compression may take a few minutes depending on video length
          </p>
        </div>
      }
    />
  )
}