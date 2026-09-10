import type { PosterCalendarEvent } from '@/data/calendario'

/** Formato post de Instagram (4:5). Todas las medidas de las placas se diseñan en estos px. */
export const POSTER_WIDTH = 1080
export const POSTER_HEIGHT = 1350

/**
 * Convierte px de diseño (base 1080) a una medida que escala con el ancho real de
 * la placa. `--p` la define `PosterFrame` como 1 px de diseño; `--k` (opcional)
 * es el factor con el que una placa achica toda su composición para entrar.
 */
export function u(designPx: number) {
  return `calc(var(--p) * var(--k, 1) * ${designPx})`
}

/** Una placa es un solo mes, salvo que tenga tan pocos eventos que quede vacía. */
export const POSTER_MIN_EVENTS = 3
export const POSTER_MAX_EVENTS = 7

export const MENDOZA_TZ = 'America/Argentina/Mendoza'

export function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('es-AR') + value.slice(1)
}

/** Luma a veces manda el nombre en MAYÚSCULAS. En pantalla se lee como título, no como cartel. */
export function displayTitle(raw: string) {
  const letters = [...raw].filter((char) => /\p{L}/u.test(char))
  if (letters.length < 3) return raw

  const upper = letters.filter((char) => {
    const up = char.toLocaleUpperCase('es-AR')
    const low = char.toLocaleLowerCase('es-AR')
    return up === char && up !== low
  }).length

  if (upper / letters.length < 0.7) return raw

  return raw
    .toLocaleLowerCase('es-AR')
    .replace(/(^|[\s/–—-])(\p{L})/gu, (_, edge: string, letter: string) => {
      return `${edge}${letter.toLocaleUpperCase('es-AR')}`
    })
}

export function eventTitle(event: PosterCalendarEvent) {
  return displayTitle((event.titles ?? []).join(': '))
}

export function placeLine(event: PosterCalendarEvent) {
  return [event.venue, event.host].filter(Boolean).join(' · ')
}

export type DateParts = {
  day: number
  year: number
  /** 0 = enero. */
  monthIndex: number
  weekdayShort: string
  weekdayLong: string
  /** «sep», sin punto. */
  monthShort: string
  /** En minúscula («septiembre»): en prosa el mes no se capitaliza. */
  monthLong: string
  monthKey: string
}

export function dateParts(dateTime: string | Date): DateParts {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-AR', { ...options, timeZone: MENDOZA_TZ }).format(date)

  const numeric = new Intl.DateTimeFormat('en-US', {
    timeZone: MENDOZA_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const read = (type: string) =>
    Number(numeric.find((part) => part.type === type)?.value ?? 0)

  const year = read('year')
  const monthIndex = read('month') - 1

  return {
    day: read('day'),
    year,
    monthIndex,
    weekdayShort: capitalize(fmt({ weekday: 'short' }).replace('.', '')),
    weekdayLong: capitalize(fmt({ weekday: 'long' })),
    // es-AR abrevia «sept»; en la placa todos los meses van a tres letras.
    monthShort: fmt({ month: 'short' }).replace('.', '').slice(0, 3),
    monthLong: fmt({ month: 'long' }),
    monthKey: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
  }
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

export type Today = { year: number; monthIndex: number; day: number }

export function todayParts(): Today {
  const parts = dateParts(new Date())
  return { year: parts.year, monthIndex: parts.monthIndex, day: parts.day }
}

export type MonthGroup = {
  key: string
  month: string
  year: number
  monthIndex: number
  events: PosterCalendarEvent[]
}

export function groupByMonth(events: PosterCalendarEvent[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const event of events) {
    const parts = dateParts(event.dateTime)
    const last = groups.at(-1)
    if (last && last.key === parts.monthKey) {
      last.events.push(event)
    } else {
      groups.push({
        key: parts.monthKey,
        month: capitalize(parts.monthLong),
        year: parts.year,
        monthIndex: parts.monthIndex,
        events: [event],
      })
    }
  }
  return groups
}

/**
 * Meses que entran en la placa: el primero siempre; se suman los siguientes solo
 * hasta juntar un mínimo de eventos. El total se recorta al máximo que cabe.
 */
export function selectPosterMonths(events: PosterCalendarEvent[]): MonthGroup[] {
  const picked: MonthGroup[] = []
  let count = 0
  for (const group of groupByMonth(events)) {
    if (picked.length > 0 && count >= POSTER_MIN_EVENTS) break
    picked.push(group)
    count += group.events.length
  }

  let remaining = POSTER_MAX_EVENTS
  return picked.flatMap((group) => {
    const slice = group.events.slice(0, remaining)
    remaining -= slice.length
    return slice.length > 0 ? [{ ...group, events: slice }] : []
  })
}

export function posterEvents(months: MonthGroup[]) {
  return months.flatMap((group) => group.events)
}

export const EVENT_LINK_FOCUS_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink'
