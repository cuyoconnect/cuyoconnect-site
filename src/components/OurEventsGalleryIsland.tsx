import { OurEventsGallerySection } from '@/OurEventsGallerySection'
import { AuthProvider } from '@/providers/AuthProvider'

export default function OurEventsGalleryIsland({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl?: string
  supabaseAnonKey?: string
}) {
  return (
    <AuthProvider
      supabaseUrl={supabaseUrl}
      supabaseAnonKey={supabaseAnonKey}
    >
      <OurEventsGallerySection />
    </AuthProvider>
  )
}
