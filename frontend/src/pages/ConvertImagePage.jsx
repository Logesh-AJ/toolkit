import { useState } from 'react'
import { getToolBySlug } from '../data/tools.js'
import ToolPageLayout from '../components/ToolPageLayout.jsx'

const FORMATS = ['jpg', 'png', 'webp']

export default function ConvertImagePage({ theme, toggleTheme }) {
  const tool = getToolBySlug('convert-image')
  const [targetFormat, setTargetFormat] = useState('png')

  return (
    <ToolPageLayout
      tool={tool}
      theme={theme}
      toggleTheme={toggleTheme}
      extraFields={{ target_format: targetFormat }}
      extraControls={
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
            Convert to
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {FORMATS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setTargetFormat(fmt)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 8,
                  border: `1px solid ${targetFormat === fmt ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: targetFormat === fmt ? 'var(--brand-gradient)' : 'var(--bg-subtle)',
                  color: targetFormat === fmt ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      }
    />
  )
}