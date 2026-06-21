import { useState, useEffect, useRef } from 'react'

export function useScrollDirection() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY
          setIsScrolled(currentY > 8)

          if (currentY > lastScrollY.current && currentY > 120) {
            setHidden(true)
          } else {
            setHidden(false)
          }

          lastScrollY.current = currentY
          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { isScrolled, hidden }
}