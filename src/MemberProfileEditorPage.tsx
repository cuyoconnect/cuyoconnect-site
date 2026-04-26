import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, Loader2, QrCode } from 'lucide-react'

import { ProfileShareQrModal } from '@/MemberProfilePage'
import { GitHubJoinCta } from '@/components/GitHubJoinCta'
import { SideCircuitDecor } from '@/components/SideCircuitDecor'
import {
  buildDefaultMemberSlug,
  EDITABLE_MEMBER_PROFILE_SOCIAL_LINKS,
  fetchMyMemberProfile,
  getMemberDisplayName,
  getMemberPublicUrl,
  getMemberSlug,
  profileToEditableInput,
  saveMyMemberProfile,
  validateEditableMemberProfile,
  type EditableMemberProfileInput,
  type MemberProfile,
} from '@/lib/member-profiles'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/AuthProvider'

const EMPTY_PROFILE_INPUT: EditableMemberProfileInput = {
  bio: '',
  linkedin_url: '',
  instagram_url: '',
  x_url: '',
}

const fieldInputClass = cn(
  'w-full rounded-xl border border-neutral-200 bg-neutral-50/40 px-4 py-3 text-[0.9375rem] leading-relaxed text-neutral-950',
  'placeholder:text-neutral-400',
  'focus-visible:border-neutral-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300/70',
)

function parseErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error)
  try {
    const parsed = JSON.parse(raw) as {
      detail?: unknown
      error?: unknown
      message?: unknown
    }
    const message = parsed.detail ?? parsed.message ?? parsed.error
    if (typeof message === 'string') return message
    if (message && typeof message === 'object') {
      const nestedMessage =
        'message' in message ? (message as { message?: unknown }).message : null
      if (typeof nestedMessage === 'string') return nestedMessage
    }
    return raw
  } catch {
    return raw
  }
}

export function MemberProfileEditorPage() {
  const { hasAuthConfigured, session, user } = useAuth()
  const [input, setInput] = useState<EditableMemberProfileInput>(EMPTY_PROFILE_INPUT)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof EditableMemberProfileInput, string>>
  >({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shareQrOpen, setShareQrOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [origin] = useState(() =>
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://cuyoconnect.com',
  )

  useEffect(() => {
    if (!session || !user) return

    let cancelled = false

    void (async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const profile = await fetchMyMemberProfile(session, user)
        if (cancelled) return
        setProfile(profile)
        setInput(profileToEditableInput(profile))
      } catch (error) {
        if (cancelled) return
        console.error('No se pudo cargar tu perfil.', error)
        setErrorMessage(parseErrorMessage(error))
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session, user])

  const publicUrl = useMemo(
    () =>
      getMemberPublicUrl(
        profile ? getMemberSlug(profile) : user ? buildDefaultMemberSlug(user) : 'tu-slash',
        origin,
      ),
    [origin, profile, user],
  )

  function updateField<K extends keyof EditableMemberProfileInput>(
    field: K,
    value: EditableMemberProfileInput[K],
  ) {
    setInput((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSuccessMessage('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!session || !user) {
      setErrorMessage('Inicia sesion con GitHub para editar tu perfil.')
      return
    }

    const nextErrors = validateEditableMemberProfile(input)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setErrorMessage('Revisa los campos marcados antes de guardar.')
      return
    }

    setIsSaving(true)
    try {
      const profile = await saveMyMemberProfile(session, user, input)
      setProfile(profile)
      setInput(profileToEditableInput(profile))
      setSuccessMessage('Perfil guardado. Tu pagina publica ya esta actualizada.')
    } catch (error) {
      console.error('No se pudo guardar tu perfil.', error)
      setErrorMessage(parseErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative isolate min-h-[100svh] overflow-hidden bg-white text-neutral-950">
      <SideCircuitDecor />

      <section className="relative z-10 px-4 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28">
        <div className={cn('mx-auto w-full min-w-0', HERO_CONTENT_WIDTH_CLASS)}>
          <header className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm font-medium tracking-[0.18em] uppercase text-neutral-500">
              Mi perfil
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Tu link CuyoConnect
            </h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
              Tu usuario, foto y link publico salen de GitHub. Aca solo editas
              una bio corta y las redes que quieras mostrar.
            </p>
          </header>

          {!hasAuthConfigured ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/80 px-5 py-5 text-sm leading-relaxed text-neutral-600">
              Hace falta configurar Supabase para editar perfiles desde este
              entorno.
            </div>
          ) : !user ? (
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-[0_18px_60px_-38px_rgba(0,0,0,0.35)] sm:p-8">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                Continuá con GitHub
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
                Usamos tu cuenta para asociar el perfil a una sola persona y
                permitir que cada miembro edite únicamente su pagina.
              </p>
              <GitHubJoinCta intent="profile" className="mt-6 items-start" />
            </div>
          ) : (
            <form
              className="mx-auto w-full max-w-2xl"
              onSubmit={(event) => void handleSubmit(event)}
              noValidate
            >
              <div className="rounded-[2rem] border border-neutral-200/90 bg-white p-6 shadow-[0_18px_60px_-38px_rgba(0,0,0,0.35)] sm:p-8">
                {isLoading ? (
                  <div className="flex min-h-60 items-center justify-center text-sm text-neutral-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando tu perfil...
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative">
                        <img
                          src={profile?.avatar_url || '/logo.png'}
                          alt=""
                          width={112}
                          height={112}
                          className="h-28 w-28 rounded-full border border-neutral-200 bg-neutral-50 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setShareQrOpen(true)}
                          className="absolute bottom-0 right-0 inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[0.6875rem] font-medium text-neutral-700 shadow-sm transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-neutral-50 hover:text-neutral-950 hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                          aria-label="Abrir QR del perfil"
                        >
                          <QrCode className="h-3.5 w-3.5" aria-hidden />
                          QR
                        </button>
                      </div>
                      <p className="mt-4 text-sm font-medium tracking-[0.18em] uppercase text-neutral-500">
                        Perfil de GitHub
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                        {profile ? getMemberDisplayName(profile) : 'Tu perfil'}
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        @{profile ? getMemberSlug(profile) : user ? buildDefaultMemberSlug(user) : 'tu-usuario'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-neutral-800">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        value={input.bio}
                        onChange={(event) => updateField('bio', event.target.value)}
                        className={cn(fieldInputClass, 'min-h-28 resize-y')}
                        placeholder="Contá en una frase qué hacés o qué estás construyendo."
                      />
                      <div className="flex items-center justify-between gap-3 text-xs text-neutral-400">
                        <span>{fieldErrors.bio ?? ''}</span>
                        <span>{input.bio.length}/280</span>
                      </div>
                    </div>

                    <div className="border-t border-neutral-200 pt-6">
                      <h2 className="text-base font-semibold tracking-tight text-neutral-950">
                        Links predefinidos
                      </h2>
                      <div className="mt-4 grid gap-4">
                        {EDITABLE_MEMBER_PROFILE_SOCIAL_LINKS.map((link) => (
                          <div key={link.id} className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-neutral-800">
                              {link.label}
                            </label>
                            <input
                              value={input[link.field]}
                              onChange={(event) =>
                                updateField(link.field, event.target.value)
                              }
                              className={fieldInputClass}
                              placeholder={link.placeholder}
                            />
                            {fieldErrors[link.field] ? (
                              <p className="text-sm text-rose-600">
                                {fieldErrors[link.field]}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    {errorMessage ? (
                      <p className="text-sm text-rose-600" role="alert">
                        {errorMessage}
                      </p>
                    ) : null}
                    {successMessage ? (
                      <p
                        className="inline-flex items-center gap-2 text-sm text-emerald-700"
                        role="status"
                      >
                        <Check className="h-4 w-4" />
                        {successMessage}
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href={publicUrl}
                        className="text-sm font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-950"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver pagina publica
                      </a>
                      <button
                        type="submit"
                        disabled={isSaving || isLoading}
                        className="inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-[#1d1d1f] px-8 py-3.5 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:w-auto"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar perfil'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <ProfileShareQrModal
                open={shareQrOpen}
                onClose={() => setShareQrOpen(false)}
                publicUrl={publicUrl}
              />
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
