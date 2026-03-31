import { EventsSection } from './EventsSection'
import { Hero } from './Hero'
import { OurEventsGallerySection } from './OurEventsGallerySection'
import { SiteHeader } from './SiteHeader'
import { TeamSection } from './TeamSection'

function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <OurEventsGallerySection />
        <EventsSection />
        <TeamSection />
      </main>
    </>
  )
}

export default App
