import { AboutSection } from './AboutSection'
import { EventsSection } from './EventsSection'
import { Hero } from './Hero'
import { OurEventsGallerySection } from './OurEventsGallerySection'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { TeamSection } from './TeamSection'

function App() {
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
