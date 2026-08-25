import { ProyectosPage } from '@/ProyectosPage'
import { AuthProvider } from '@/providers/AuthProvider'

export default function ProyectosPageIsland({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl?: string
  supabaseAnonKey?: string
}) {
  return (
    <AuthProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey}>
      <ProyectosPage />
    </AuthProvider>
  )
}
