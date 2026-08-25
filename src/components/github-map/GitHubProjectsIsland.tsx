import { GitHubProjectsBubblesSection } from '@/GitHubProjectsBubblesSection'
import { AuthProvider } from '@/providers/AuthProvider'

export default function GitHubProjectsIsland({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl?: string
  supabaseAnonKey?: string
}) {
  return (
    <AuthProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey}>
      <GitHubProjectsBubblesSection />
    </AuthProvider>
  )
}
