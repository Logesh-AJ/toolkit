import { useState } from 'react'
import { getToolBySlug } from '../data/tools.js'
import ToolPageLayout from '../components/ToolPageLayout.jsx'
import PasswordField from '../components/PasswordField.jsx'

export default function ProtectPdfPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('protect-pdf')
  const [password, setPassword] = useState('')

  return (
    <ToolPageLayout
      tool={tool}
      theme={theme}
      toggleTheme={toggleTheme}
      extraFields={{ password }}
      extraControls={
        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="Set a password for this PDF"
        />
      }
    />
  )
}