import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import TrustSection from '../components/TrustSection.jsx'
import ToolGrid from '../components/ToolGrid.jsx'
import RecentTools from '../components/RecentTools.jsx'
import FAQ from '../components/FAQ.jsx'
import Footer from '../components/Footer.jsx'
import { useRecentTools } from '../hooks/useRecentTools.js'

export default function HomePage({ theme, toggleTheme }) {
  const { recentSlugs } = useRecentTools()

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Hero />
        <TrustSection />
        <RecentTools recentSlugs={recentSlugs} />
        <ToolGrid />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}