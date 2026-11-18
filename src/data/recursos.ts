export type RecursoKind = 'presentacion' | 'guia' | 'otro'

export type RecursoCategory =
  | 'presentaciones'
  | 'guias'
  | 'plantillas'
  | 'enlaces'

export type RecursoItem = {
  id: string
  title: string
  description: string
  category: RecursoCategory
  /** Uso interno / futuros filtros; no se muestra como etiqueta en la tarjeta. */
  kind: RecursoKind
  /** URL pública; omitir cuando el material todavía no está disponible. */
  href?: string
  linkLabel?: string
  speaker?: string
  /** Fecha legible (mismo criterio que eventos en la landing). */
  date: string
  /** ISO `YYYY-MM-DD` para `<time dateTime>` y orden en pantalla (más nuevo arriba). */
  dateSort: string
  /** Imagen de tapa; si falta, la página elige un fallback de `/events/`. */
  coverImage?: string
  coverPosition?: 'right' | 'center top'
  colorOnHover?: boolean
  coverScale?: number
  coverOrigin?: string
  hideDate?: boolean
}

/** Coberturas por defecto cuando un ítem no define `coverImage` (misma librería que la landing). */
export const RECURSO_COVER_FALLBACKS: readonly string[] = [
  '/events/event-24.webp',
  '/events/event-12.webp',
  '/events/event-01.webp',
  '/events/event-23.webp',
  '/events/event-09.webp',
  '/events/event-02.webp',
]

/**
 * Materiales de capacitaciones y encuentros. En `/recursos` se ordenan por `dateSort` descendente
 * (más reciente primero). El orden en este archivo es indiferente para la UI.
 */
export const RECURSOS: RecursoItem[] = [
  {
    id: 'grok-bot-valentin-mathey',
    title: 'Mis bots trabajan mientras duermo: cómo armé un equipo de agentes de IA con su propio dashboard',
    description: 'Presentación de Valentín Mathey en el encuentro Grok Bot.',
    speaker: 'Valentín Mathey',
    category: 'presentaciones',
    kind: 'presentacion',
    href: '/recursos/mis-bots-trabajan-mientras-duermo-valentin-mathey.pdf',
    date: '18 nov 2026',
    dateSort: '2026-11-18',
    coverImage: '/recursos/valentin-portrait.webp',
    coverPosition: 'center top',
    colorOnHover: true,
    hideDate: true,
  },
  {
    id: 'grok-bot-julio-marquez',
    title: 'Cómo administrar tus finanzas personales con Grok Bot',
    description: 'Charla de Julio Márquez en el encuentro Grok Bot.',
    speaker: 'Julio Márquez',
    href: 'https://x.ai/bot/dfG-ichRYq-X2EwIbSrLE',
    linkLabel: 'Abrir bot',
    category: 'presentaciones',
    kind: 'presentacion',
    date: '18 nov 2026',
    dateSort: '2026-11-18',
    coverImage: '/recursos/julio-portrait.webp',
    coverPosition: 'center top',
    colorOnHover: true,
    hideDate: true,
  },
  {
    id: 'grok-bot-simon-puebla',
    title: 'Grokbot y negocio: cómo ponerlo a conseguir reuniones para tu empresa',
    description: 'Charla de Simón Puebla en el encuentro Grok Bot.',
    speaker: 'Simón Puebla',
    category: 'presentaciones',
    kind: 'presentacion',
    date: '18 nov 2026',
    dateSort: '2026-11-18',
    coverImage: '/recursos/simon-portrait.webp',
    coverPosition: 'center top',
    colorOnHover: true,
    coverScale: 1.7,
    coverOrigin: '58% 55%',
    hideDate: true,
  },
  {
    id: 'stellar-sprint-incuba-web3',
    speaker: 'Celina Paez',
    title: 'Stellar Sprint - Incuba web 3',
    description: 'Presentación Google Slides (Stellar Sprint / Incuba web3).',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://docs.google.com/presentation/d/1zf_2M0YMVdgSE0cV5mmQse1gLt4XE28y/edit?usp=sharing&ouid=100104594060398177510&rtpof=true&sd=true',
    date: '25 abr 2026',
    dateSort: '2026-04-25',
    coverImage: '/recursos/stellar-sprint-incuba-web3.webp',
  },
  {
    id: 'stellar-workshop-ia-web3',
    speaker: 'Matías Boldrini',
    title: 'Workshop en IA en Web3',
    description: 'Presentación Stellar.',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://stellar-01.vercel.app/',
    date: '11 abr 2026',
    dateSort: '2026-04-11',
    coverImage: '/recursos/stellar-ia-web3-cover-v3.webp',
  },
  {
    id: 'stellar-de0-a-primera-transaccion',
    speaker: 'Ticiana Angelucci',
    title: 'De 0 a tu primera transacción',
    description: 'Presentación Canva (Stellar).',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://canva.link/xle11aaw3hw715i',
    date: '11 abr 2026',
    dateSort: '2026-04-11',
    coverImage: '/recursos/stellar-primera-transaccion-cover-v2.webp',
  },
]

export const RECURSO_CATEGORY_LABEL: Record<RecursoCategory, string> = {
  presentaciones: 'Presentaciones',
  guias: 'Guías',
  plantillas: 'Plantillas',
  enlaces: 'Enlaces',
}
