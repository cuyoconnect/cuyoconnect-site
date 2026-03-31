/**
 * Galería “Nuestros eventos”: imágenes WebP 400×400 (recorte centrado, calidad ~90)
 * generadas desde los ZIP en Descargas (CURSOR, DIA 2, fotos).
 */
export type GalleryEventRecord = {
  published: boolean
  order: number
  image: string
  title: string
  subtitle?: string
  href: string
}

const LUMA_CAL =
  'https://luma.com/calendar/cal-GDIEkhScyp1dPKU' as const

export const EVENTS_GALLERY: GalleryEventRecord[] = [
  {
    published: true,
    order: 1,
    image: '/events/event-01.webp',
    title: 'CuyoConnect',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 2,
    image: '/events/event-02.webp',
    title: 'Encuentro',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 3,
    image: '/events/event-03.webp',
    title: 'Comunidad',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 4,
    image: '/events/event-04.webp',
    title: 'Networking',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 5,
    image: '/events/event-05.webp',
    title: 'Panel',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 6,
    image: '/events/event-06.webp',
    title: 'Día 2',
    subtitle: 'Mesa y debate',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 7,
    image: '/events/event-07.webp',
    title: 'Charla',
    subtitle: 'Día 2',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 8,
    image: '/events/event-08.webp',
    title: 'Audiencia',
    subtitle: 'Día 2',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 9,
    image: '/events/event-09.webp',
    title: 'Experiencia',
    subtitle: 'Día 2',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 10,
    image: '/events/event-10.webp',
    title: 'Cierre',
    subtitle: 'Día 2',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 11,
    image: '/events/event-11.webp',
    title: 'Cuyo Connect',
    subtitle: 'Fotos oficiales',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 12,
    image: '/events/event-12.webp',
    title: 'Territorio',
    subtitle: 'Encuentro',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 13,
    image: '/events/event-13.webp',
    title: 'Vínculos',
    subtitle: 'Comunidad',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 14,
    image: '/events/event-14.webp',
    title: 'Momento',
    subtitle: 'CuyoConnect',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 15,
    image: '/events/event-15.webp',
    title: 'Latido',
    subtitle: 'Red y datos',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 16,
    image: '/events/event-16.webp',
    title: 'Presentes',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 17,
    image: '/events/event-17.webp',
    title: 'Conversación',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 18,
    image: '/events/event-18.webp',
    title: 'Ideas',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 19,
    image: '/events/event-19.webp',
    title: 'Instituciones',
    subtitle: 'CURSOR',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 20,
    image: '/events/event-20.webp',
    title: 'Apertura',
    subtitle: 'Día 2',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 21,
    image: '/events/event-21.webp',
    title: 'Mesa',
    subtitle: 'Día 2',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 22,
    image: '/events/event-22.webp',
    title: 'Público',
    subtitle: 'Día 2',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 23,
    image: '/events/event-23.webp',
    title: 'Registro',
    subtitle: 'Fotos oficiales',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 24,
    image: '/events/event-24.webp',
    title: 'Detalle',
    subtitle: 'Encuentro',
    href: LUMA_CAL,
  },
  {
    published: true,
    order: 25,
    image: '/events/event-25.webp',
    title: 'Clausura',
    subtitle: 'CuyoConnect',
    href: LUMA_CAL,
  },
]
