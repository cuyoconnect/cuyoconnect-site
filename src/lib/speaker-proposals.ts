import type { User } from '@supabase/supabase-js'

import { getSupabaseBrowserClient } from '@/lib/supabase'

export type SpeakerProposalDuration = 30 | 45 | 60

export async function submitSpeakerProposal(input: {
  topics: string
  durationMinutes: SpeakerProposalDuration
  user: User
}): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Revisá PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  const { user } = input
  const meta = user.user_metadata as Record<string, string | undefined>

  const { error } = await supabase.from('speaker_proposals').insert({
    user_id: user.id,
    topics: input.topics.trim(),
    duration_minutes: input.durationMinutes,
    contact_email: user.email ?? null,
    github_login: meta.user_name ?? meta.preferred_username ?? null,
    display_name: meta.full_name ?? meta.name ?? null,
  })

  if (error) {
    console.error('speaker_proposals insert', error)
    const msg = error.message ?? ''
    if (/row-level security|RLS/i.test(msg) || error.code === '42501') {
      throw new Error(
        'No pudimos guardar: revisá las políticas RLS de la tabla speaker_proposals en Supabase.',
      )
    }
    if (/relation|does not exist/i.test(msg)) {
      throw new Error(
        'Falta crear la tabla speaker_proposals. Ejecutá el SQL del archivo supabase/speaker_proposals.sql en el panel de Supabase.',
      )
    }
    throw new Error(msg || 'No pudimos guardar tu propuesta. Intentá de nuevo.')
  }
}
