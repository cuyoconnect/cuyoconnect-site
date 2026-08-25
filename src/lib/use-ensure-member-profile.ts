import { useEffect, useRef } from 'react'

import { fetchMyMemberProfile } from '@/lib/member-profiles'
import { useAuth } from '@/providers/AuthProvider'

export function useEnsureMemberProfile() {
  const { session, user } = useAuth()
  const attemptedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!session || !user) return
    if (attemptedFor.current === user.id) return
    attemptedFor.current = user.id

    void fetchMyMemberProfile(session, user).catch((error) => {
      console.error('No se pudo asegurar el perfil de miembro.', error)
      attemptedFor.current = null
    })
  }, [session, user])
}
