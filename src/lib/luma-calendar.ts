import {
  LUMA_CALENDAR_HREF,
  LUMA_CALENDAR_ID,
  lumaEventHref,
} from '@/lib/community-links'
import type { PosterCalendarEvent } from '@/data/calendario'

const LUMA_ITEMS_URL =
  `https://api.lu.ma/calendar/get-items?calendar_api_id=${LUMA_CALENDAR_ID}&period=future`

type LumaHost = {
  name?: string | null
}

type LumaGeo = {
  address?: string | null
  city?: string | null
  localized?: Record<string, { address?: string | null }>
}

type LumaEvent = {
  api_id?: string
  name?: string
  url?: string
  start_at?: string
  timezone?: string
  cover_url?: string | null
  geo_address_info?: LumaGeo | null
}

type LumaEntry = {
  event?: LumaEvent
  hosts?: LumaHost[]
}

type LumaCalendarPayload = {
  entries?: LumaEntry[]
}

function formatTimeLabel(startAt: string, timeZone: string) {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(startAt))
}

function stripDecorations(value: string) {
  return value
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitTitles(name: string) {
  const cleaned = stripDecorations(name)
  const colon = cleaned.indexOf(': ')
  if (colon > 0 && colon < 42) {
    return [cleaned.slice(0, colon), cleaned.slice(colon + 2)].filter(Boolean)
  }
  return [cleaned]
}

function shortVenue(geo: LumaGeo | null | undefined) {
  const localized = geo?.localized?.['es-419']?.address
  const address = localized || geo?.address || ''
  if (/champagnat/i.test(address)) return 'Universidad Champagnat'
  if (/mendoza tic|parque tecnol/i.test(address)) return 'Mendoza TIC'
  return stripDecorations(address) || geo?.city || undefined
}

function hostLabel(hosts: LumaHost[] | undefined) {
  const names = (hosts ?? [])
    .map((host) => host.name?.trim())
    .filter((name): name is string => Boolean(name))
  if (names.length === 0) return undefined
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
}

export function lumaCalendarHref() {
  return LUMA_CALENDAR_HREF
}

export async function fetchLumaPosterEvents(): Promise<PosterCalendarEvent[]> {
  const response = await fetch(LUMA_ITEMS_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'CuyoConnect/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Luma respondió ${response.status}`)
  }

  const payload = (await response.json()) as LumaCalendarPayload
  const entries = (payload.entries ?? []).filter((entry) => {
    const name = entry.event?.name ?? ''
    return !/accelerate robotics/i.test(name)
  })

  return entries.flatMap((entry) => {
    const event = entry.event
    if (!event?.api_id || !event.name || !event.url || !event.start_at) {
      return []
    }

    const timeZone = event.timezone || 'America/Argentina/Mendoza'

    return [
      {
        id: event.api_id,
        dateTime: event.start_at,
        titles: splitTitles(event.name),
        host: hostLabel(entry.hosts),
        venue: shortVenue(event.geo_address_info),
        time: formatTimeLabel(event.start_at, timeZone),
        href: lumaEventHref(event.url),
        coverUrl: event.cover_url ?? undefined,
      },
    ]
  })
}
