import { AuthProvider } from '@/providers/AuthProvider'
import { SpeakersPage } from '@/SpeakersPage'

export default function SpeakersIsland({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl?: string
  supabaseAnonKey?: string
}) {
  return (
    <AuthProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey}>
      <SpeakersPage />
    </AuthProvider>
  )
}
