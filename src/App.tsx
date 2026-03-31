import { EventsSection } from './EventsSection'
import { Hero } from './Hero'
import { OurEventsGallerySection } from './OurEventsGallerySection'
import { SiteHeader } from './SiteHeader'

function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <OurEventsGallerySection />
        <EventsSection />
      </main>
    </>
  )
}

export default App
