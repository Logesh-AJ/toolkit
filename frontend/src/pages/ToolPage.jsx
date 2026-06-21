import { useParams, Navigate } from 'react-router-dom'
import { getToolBySlug } from '../data/tools.js'
import ToolPageLayout from '../components/ToolPageLayout.jsx'

export default function ToolPage({ theme, toggleTheme }) {
  const { slug } = useParams()
  const tool = getToolBySlug(slug)

  if (!tool) {
    return <Navigate to="/" replace />
  }

  return <ToolPageLayout tool={tool} theme={theme} toggleTheme={toggleTheme} />
}