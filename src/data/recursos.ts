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
  /** URL absoluta (Drive, PDF, sitio, etc.) */
  href: string
  /** Fecha legible (mismo criterio que eventos en la landing). */
  date: string
  /** ISO `YYYY-MM-DD` para `<time dateTime>` y orden en pantalla (más nuevo arriba). */
  dateSort: string
  /** Imagen de tapa; si falta, la página elige un fallback de `/events/`. */
  coverImage?: string
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
    id: 'stellar-sprint-incuba-web3',
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
    title: 'Workshop en IA en Web3',
    description: 'Presentación Stellar.',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://stellar-01.vercel.app/',
    date: '11 abr 2026',
    dateSort: '2026-04-11',
    coverImage: '/recursos/stellar-workshop-slide.png',
  },
  {
    id: 'stellar-de0-a-primera-transaccion',
    title: 'De 0 a tu primera transacción',
    description: 'Presentación Canva (Stellar).',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://canva.link/xle11aaw3hw715i',
    date: '11 abr 2026',
    dateSort: '2026-04-11',
    coverImage: '/recursos/stellar-primera-transaccion-slide.png',
  },
]

export const RECURSO_CATEGORY_LABEL: Record<RecursoCategory, string> = {
  presentaciones: 'Presentaciones',
  guias: 'Guías',
  plantillas: 'Plantillas',
  enlaces: 'Enlaces',
}
