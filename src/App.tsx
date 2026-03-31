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
        <TeamSection />
        <EventsSection />
      </main>
    </>
  )
}

export default App
