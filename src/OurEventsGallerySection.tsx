import { useEffect, useMemo, useState } from 'react'
import DomeGallery from '@/components/DomeGallery'
import { GitHubJoinCta } from '@/components/GitHubJoinCta'
import { BlurText } from '@/components/ui/blur-text'
import {
  fetchVisibleMemberProfiles,
  getMemberDisplayName,
  getMemberSubtitle,
  type MemberProfile,
} from '@/lib/member-profiles'
import {
  DOME_STAGE_WIDTH_CLASS,
  HERO_CONTENT_WIDTH_CLASS,
} from '@/lib/content-width'
import { heroTopicTailHighlight } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/AuthProvider'

const MEMBERS_GALLERY_HEADING = 'Personas de CuyoConnect'

export function OurEventsGallerySection() {
  const { hasAuthConfigured } = useAuth()
  const tailHighlight = useMemo(() => heroTopicTailHighlight(2), [])
  const [profiles, setProfiles] = useState<MemberProfile[]>([])
  const [isLoading, setIsLoading] = useState(hasAuthConfigured)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    if (!hasAuthConfigured) {
      setProfiles([])
      setErrorMessage('')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    void fetchVisibleMemberProfiles()
      .then((nextProfiles) => {
        if (cancelled) return
        setProfiles(nextProfiles)
      })
      .catch((error) => {
        if (cancelled) return
        console.error('No se pudieron cargar los perfiles publicos.', error)
        setErrorMessage(
          'Todavia no pudimos cargar los perfiles de GitHub. Revisa la tabla `member_profiles` en Supabase.',
        )
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [hasAuthConfigured])

  const images = profiles.map((profile) => ({
    src: profile.avatar_url,
    alt: getMemberDisplayName(profile),
    title: getMemberDisplayName(profile),
    subtitle: getMemberSubtitle(profile),
    href: profile.github_url,
    hrefLabel: `Abrir GitHub de ${getMemberDisplayName(profile)}`,
  }))

  const emptyStateMessage = hasAuthConfigured
    ? 'Todavia no hay personas visibles en la comunidad.'
    : 'Configura GitHub en Supabase para empezar a poblar la galería.'

  return (
    <section
      id="nuestros-eventos"
      className="bg-white py-16 text-neutral-950 sm:py-20"
      aria-labelledby="nuestros-eventos-heading"
    >
      <div className="w-full">
        <div
          className={cn(
            'mx-auto w-full min-w-0 px-4 text-left sm:px-6',
            HERO_CONTENT_WIDTH_CLASS,
          )}
        >
          <h2
            id="nuestros-eventos-heading"
            className={cn(
              'w-full max-w-full text-balance text-2xl font-semibold tracking-tight text-neutral-950',
              'sm:text-3xl md:text-4xl',
            )}
          >
            <BlurText
              text={MEMBERS_GALLERY_HEADING}
              className="text-inherit"
              segmentDelay={0.14}
              duration={0.95}
              tailHighlight={tailHighlight}
            />
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base text-neutral-600 sm:text-lg">
            Cada persona que se una con GitHub aparece en la galería con su
            avatar y un acceso directo a su perfil público.
          </p>
        </div>

        <div
          className={cn(
            'mx-auto mt-10 w-full min-w-0 sm:mt-12',
            DOME_STAGE_WIDTH_CLASS,
          )}
        >
          <div
            className={cn(
              'relative w-full overflow-hidden bg-white',
              'h-[340px] sm:h-[440px] md:h-[560px] lg:h-[600px]',
            )}
          >
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-neutral-400">
                Cargando comunidad...
              </div>
            ) : errorMessage ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-500 sm:text-base">
                {errorMessage}
              </div>
            ) : images.length > 0 ? (
              <DomeGallery
                images={images}
                fit={0.66}
                minRadius={500}
                heightGuardFactor={1.48}
                segments={30}
                maxVerticalRotationDeg={0}
                imageBorderRadius="14px"
                overlayBlurColor="#ffffff"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">
                {emptyStateMessage}
              </div>
            )}
          </div>
        </div>

        <GitHubJoinCta className="mt-12 text-center sm:mt-14" />
      </div>
    </section>
  )
}
