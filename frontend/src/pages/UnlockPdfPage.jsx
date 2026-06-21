import { useState } from 'react'
import { getToolBySlug } from '../data/tools.js'
import ToolPageLayout from '../components/ToolPageLayout.jsx'
import PasswordField from '../components/PasswordField.jsx'

export default function UnlockPdfPage({ theme, toggleTheme }) {
  const tool = getToolBySlug('unlock-pdf')
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
          placeholder="Enter the PDF's current password"
        />
      }
    />
  )
}