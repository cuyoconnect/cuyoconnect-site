import { useEffect } from 'react'

import { AboutSection } from './AboutSection'
import { EventsSection } from './EventsSection'
import { Hero } from './Hero'
import { OurEventsGallerySection } from './OurEventsGallerySection'
import { PastEventsSliderSection } from './PastEventsSliderSection'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { TeamSection } from './TeamSection'
import { scheduleScrollFromLocation } from '@/lib/section-scroll'

/**
 * Tras montar React, vuelve a aplicar el scroll: el nativo por `#…` corre
 * contra un DOM vacío; las rutas `/eventos` y `/miembros` necesitan el mismo
 * reintento por frames (ver `scheduleScrollFromLocation`).
 */
function useSectionDeepLinkScroll() {
  useEffect(() => {
    scheduleScrollFromLocation()

    const onHashChange = () => {
      scheduleScrollFromLocation()
    }

    const onPopState = () => {
      scheduleScrollFromLocation()
    }

    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])
}

function App() {
  useSectionDeepLinkScroll()

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <AboutSection />
        <OurEventsGallerySection />
        <PastEventsSliderSection />
        <EventsSection />
        <TeamSection />
      </main>
      <SiteFooter />
    </>
  )
}



export default App
