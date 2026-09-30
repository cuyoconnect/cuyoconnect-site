import { ArrowUpRight } from 'lucide-react'

import { PosterFrame } from '@/components/calendario/PosterFrame'
import { u } from '@/components/calendario/shared'
import { BlurText } from '@/components/ui/blur-text'

const STORY_WIDTH = 1080
const STORY_HEIGHT = 1920

/** Pegá acá el form cuando lo tengas. */
export const SPEAKER_FORM_HREF = 'https://cuyoconnect.com/speakers'

export function SpeakerCallPoster() {
  return (
    <PosterFrame width={STORY_WIDTH} height={STORY_HEIGHT}>
      <article
        className="relative flex h-full flex-col overflow-hidden bg-paper text-ink"
        style={{ padding: `${u(80)} ${u(64)} ${u(72)}` }}
      >
        <div
          className="pointer-events-none absolute rounded-full bg-sun"
          style={{
            right: u(-180),
            bottom: u(-80),
            width: u(780),
            height: u(680),
            filter: 'blur(72px)',
            opacity: 0.7,
          }}
          aria-hidden
        />

        <img
          src="/logo.png"
          alt=""
          width={882}
          height={882}
          decoding="async"
          className="absolute object-contain"
          style={{ top: u(80), right: u(64), width: u(128) }}
        />

        <h2
          className="relative z-10 font-bebas font-normal uppercase tracking-tight"
          style={{
            marginTop: u(40),
            fontSize: u(176),
            lineHeight: 0.8,
            maxWidth: u(860),
          }}
        >
          <span className="block">
            <BlurText text="Querés" inViewInitial segmentDelay={0.08} duration={0.5} />
          </span>
          <span className="block">
            <BlurText
              text="ser"
              inViewInitial
              segmentDelay={0.08}
              duration={0.5}
              delay={0.07}
            />
          </span>
          <span className="block text-sun">
            <BlurText
              text="speaker"
              className="text-sun"
              inViewInitial
              segmentDelay={0.08}
              duration={0.5}
              delay={0.14}
            />
          </span>
        </h2>

        <p
          className="relative z-10 text-pretty font-sans text-ink-soft"
          style={{
            marginTop: u(44),
            maxWidth: u(680),
            fontSize: u(32),
            lineHeight: 1.4,
          }}
        >
          Contá un proyecto, una experiencia o algo que aprendiste.
        </p>

        <a
          href={SPEAKER_FORM_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 mt-auto inline-flex w-fit items-center justify-center rounded-full bg-ink font-sans font-medium text-white"
          style={{
            gap: u(10),
            height: u(88),
            paddingInline: u(36),
            fontSize: u(26),
          }}
        >
          Enviar propuesta
          <ArrowUpRight
            aria-hidden
            strokeWidth={2.25}
            style={{ width: u(22), height: u(22) }}
          />
        </a>
      </article>
    </PosterFrame>
  )
}
