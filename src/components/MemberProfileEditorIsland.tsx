import { MemberProfileEditorPage } from '@/MemberProfileEditorPage'
import { AuthProvider } from '@/providers/AuthProvider'

export default function MemberProfileEditorIsland({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl?: string
  supabaseAnonKey?: string
}) {
  return (
    <AuthProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey}>
      <MemberProfileEditorPage />
    </AuthProvider>
  )
}
