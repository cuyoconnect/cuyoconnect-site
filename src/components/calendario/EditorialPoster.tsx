import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Marker, PosterFrame } from './PosterFrame'
import {
  EVENT_LINK_FOCUS_CLASS,
  POSTER_HEIGHT,
  dateParts,
  eventTitle,
  type MonthGroup,
  u,
} from './shared'

/**
 * Estimación (en px de diseño) del alto que ocupa la agenda a escala 1. Sirve
 * para que el HTML del servidor ya salga con un factor razonable; en el
 * cliente se afina midiendo.
 */
function estimateScale(months: MonthGroup[]) {
  const outer = months.length === 1 ? 0 : 72 + 36 * (months.length - 1)
  const total = months.reduce((sum, group) => {
    const header = 60 + 116 + 40 + 28
    const rows = group.events.reduce((rowsSum, event) => {
      const lines = Math.ceil(eventTitle(event).length / 38)
      const right = lines * 41 + 14 + 23 + (event.host ? 27 : 0)
      return rowsSum + 80 + Math.max(74 + 14 + 19, right)
    }, 0)
    return sum + header + rows
  }, outer)
  return Math.min(1, POSTER_HEIGHT / total)
}

/**
 * Editorial: cada mes es una hoja de papel con su nombre marcado en amarillo y
 * una fila por evento. El día va en Sora, con el día de la semana en versalitas
 * debajo; a la derecha, título, «hora · lugar» y quién organiza. Sin marca ni
 * encabezado: la placa es solo la agenda.
 *
 * Toda la composición se achica con `--k` hasta que entra en el 4:5.
 */
export function EditorialPoster({ months }: { months: MonthGroup[] }) {
  const single = months.length === 1
  const rootRef = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(() => estimateScale(months))

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const overflow = root.scrollHeight - root.clientHeight
    if (overflow > 1) {
      setK((current) => Math.max(0.5, current * (root.clientHeight / root.scrollHeight) * 0.985))
    }
  }, [k, months])

  return (
    <PosterFrame>
      <div
        ref={rootRef}
        className="flex h-full flex-col bg-white"
        style={{
          ['--k' as string]: k.toFixed(4),
          padding: single ? 0 : u(36),
          gap: u(36),
        }}
      >
        {months.map((group) => (
          <MonthSheet
            key={group.key}
            group={group}
            className="grow rounded-[calc(var(--p)*var(--k,1)*6)] bg-paper"
          />
        ))}
      </div>
    </PosterFrame>
  )
}

function MonthSheet({ group, className }: { group: MonthGroup; className?: string }) {
  return (
    <section
      className={cn('flex flex-col text-ink', className)}
      style={{ padding: `${u(60)} ${u(48)} ${u(28)}` }}
      aria-label={`${group.month} ${group.year}`}
    >
      <h2
        className="font-bebas uppercase leading-none tracking-tight"
        style={{ fontSize: u(116) }}
      >
        <Marker>{group.month}</Marker>
      </h2>

      <ol className="flex flex-1 flex-col" style={{ marginTop: u(40) }}>
        {group.events.map((event) => {
          const parts = dateParts(event.dateTime)
          const title = eventTitle(event)
          const when = [event.time, event.venue].filter(Boolean).join(' · ')

          return (
            <li key={event.id} className="flex border-t border-ink/12">
              <a
                href={event.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('flex w-full items-start', EVENT_LINK_FOCUS_CLASS)}
                style={{ gap: u(24), paddingBlock: u(40) }}
                aria-label={`${title}. ${parts.weekdayLong} ${parts.day} de ${parts.monthLong}. Se abre en Luma`}
              >
                <div className="flex shrink-0 flex-col items-center text-center" style={{ width: u(120) }}>
                  <span
                    className="block font-semibold leading-none tracking-tight tabular-nums"
                    style={{ fontSize: u(74) }}
                  >
                    {parts.day}
                  </span>
                  <span
                    className="block font-semibold uppercase text-ink/50"
                    style={{
                      fontSize: u(19),
                      letterSpacing: '0.18em',
                      // compensa el tracking sobrante a la derecha del último carácter
                      paddingLeft: '0.18em',
                      marginTop: u(14),
                    }}
                  >
                    {parts.weekdayShort}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="font-semibold leading-[1.2] tracking-tight text-pretty"
                    style={{ fontSize: u(34) }}
                  >
                    {title}
                  </p>
                  {when ? (
                    <p className="text-ink/60" style={{ fontSize: u(23), marginTop: u(14) }}>
                      {when}
                    </p>
                  ) : null}
                  {event.host ? (
                    <p className="text-ink/60 text-pretty" style={{ fontSize: u(23), marginTop: u(4) }}>
                      {event.host}
                    </p>
                  ) : null}
                </div>

                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-ink/35"
                  style={{ width: u(26), height: u(26), marginTop: u(6) }}
                >
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </a>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
