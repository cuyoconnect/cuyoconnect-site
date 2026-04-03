import { useEffect } from 'react'

import { AboutSection } from './AboutSection'
import { EventsSection } from './EventsSection'
import { Hero } from './Hero'
import { OurEventsGallerySection } from './OurEventsGallerySection'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { TeamSection } from './TeamSection'

/**
 * After React mounts, the browser's native hash-scroll has already fired
 * (against a still-empty DOM). Re-trigger it so the target section receives
 * a smooth scroll once every element is painted.
 */
function useHashScrollOnMount() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    requestAnimationFrame(() => {
      const target = document.querySelector(hash)
      if (!target) return
      // Prefer the inner heading so we skip past decorative section padding.
      const heading = target.querySelector('[id$="-heading"]')
      ;(heading ?? target).scrollIntoView({ behavior: 'smooth' })
    })
  }, [])
}

function App() {
  useHashScrollOnMount()

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <AboutSection />
        <OurEventsGallerySection />
        <EventsSection />
        <TeamSection />
      </main>
      <SiteFooter />
    </>
  )
}



export default App
