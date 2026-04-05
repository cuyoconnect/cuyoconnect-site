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
    id: 'ejemplo-presentacion',
    title: 'Intro a la comunidad (plantilla)',
    description:
      'Reemplazá por tu deck principal. Buen candidato a quedar primero como destacado.',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://cuyoconnect.com/',
    date: '4 abr 2026',
    dateSort: '2026-04-04',
    coverImage: '/events/event-24.webp',
  },
  {
    id: 'ejemplo-guia',
    title: 'Guía rápida para participantes',
    description:
      'PDF o carpeta compartida: texto corto y claro en la grilla ayuda a escanear diez ítems.',
    category: 'guias',
    kind: 'guia',
    href: 'https://cuyoconnect.com/',
    date: '12 mar 2026',
    dateSort: '2026-03-12',
    coverImage: '/events/event-12.webp',
  },
  {
    id: 'placeholder-03',
    title: 'Taller: flujo de trabajo con IA',
    description: 'Plantilla: sumá slides o enlace real cuando lo tengas.',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://cuyoconnect.com/',
    date: '28 feb 2026',
    dateSort: '2026-02-28',
    coverImage: '/events/event-01.webp',
  },
  {
    id: 'placeholder-04',
    title: 'Notas del encuentro de networking',
    description: 'Material de apoyo; mantené una línea de descripción por ítem.',
    category: 'guias',
    kind: 'guia',
    href: 'https://cuyoconnect.com/',
    date: '15 feb 2026',
    dateSort: '2026-02-15',
    coverImage: '/events/event-23.webp',
  },
  {
    id: 'placeholder-05',
    title: 'Checklist para speakers',
    description: 'Un bullet en data.ts = una tarjeta en la grilla.',
    category: 'plantillas',
    kind: 'otro',
    href: 'https://cuyoconnect.com/',
    date: '2 feb 2026',
    dateSort: '2026-02-02',
  },
  {
    id: 'placeholder-06',
    title: 'Intro a Web3 (edición Cuyo)',
    description: 'Mezclá guías y decks; el orden del array define el storytelling.',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://cuyoconnect.com/',
    date: '20 ene 2026',
    dateSort: '2026-01-20',
    coverImage: '/events/event-09.webp',
  },
  {
    id: 'placeholder-07',
    title: 'Recursos abiertos y licencias',
    description: 'Texto breve: en ~10 ítems la gente escanea fechas y títulos.',
    category: 'guias',
    kind: 'guia',
    href: 'https://cuyoconnect.com/',
    date: '8 ene 2026',
    dateSort: '2026-01-08',
  },
  {
    id: 'placeholder-08',
    title: 'Workshop: prototipos en vivo',
    description: 'Podés borrar estos placeholders y pegar tus URLs.',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://cuyoconnect.com/',
    date: '18 dic 2025',
    dateSort: '2025-12-18',
    coverImage: '/events/event-02.webp',
  },
  {
    id: 'placeholder-09',
    title: 'Links útiles post-evento',
    description: 'Carpeta o Notion: tres líneas máximo va bien en móvil.',
    category: 'enlaces',
    kind: 'otro',
    href: 'https://cuyoconnect.com/',
    date: '5 dic 2025',
    dateSort: '2025-12-05',
  },
  {
    id: 'placeholder-10',
    title: 'Cierre + próximos pasos',
    description: 'Último ítem en la lista; en la UI sigue el mismo ritmo animado.',
    category: 'presentaciones',
    kind: 'presentacion',
    href: 'https://cuyoconnect.com/',
    date: '21 nov 2025',
    dateSort: '2025-11-21',
    coverImage: '/events/event-21.webp',
  },
]

export const RECURSO_CATEGORY_LABEL: Record<RecursoCategory, string> = {
  presentaciones: 'Presentaciones',
  guias: 'Guías',
  plantillas: 'Plantillas',
  enlaces: 'Enlaces',
}
