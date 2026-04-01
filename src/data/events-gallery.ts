/**
 * Galería "Nuestros eventos": imágenes WebP 400×400 (recorte centrado, calidad ~90)
 * generadas desde los ZIP en Descargas (CURSOR, DIA 2, fotos).
 */
export type GalleryEventRecord = {
  published: boolean
  order: number
  image: string
  title: string
  date?: string
  href: string
}

const INSTAGRAM_URL =
  'https://www.instagram.com/cuyoconnect/' as const

export const EVENTS_GALLERY: GalleryEventRecord[] = [
  {
    published: true,
    order: 1,
    image: '/events/event-01.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 2,
    image: '/events/event-02.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 3,
    image: '/events/event-03.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 4,
    image: '/events/event-04.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 5,
    image: '/events/event-05.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 6,
    image: '/events/event-06.webp',
    title: 'Hackathon Aleph',
    date: '23 ago 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 7,
    image: '/events/event-07.webp',
    title: 'Hackathon Aleph',
    date: '23 ago 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 8,
    image: '/events/event-08.webp',
    title: 'Hackathon Aleph',
    date: '23 ago 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 9,
    image: '/events/event-09.webp',
    title: 'Hackathon Aleph',
    date: '23 ago 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 10,
    image: '/events/event-10.webp',
    title: 'Hackathon Aleph',
    date: '23 ago 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 11,
    image: '/events/event-11.webp',
    title: 'Stellar Summer Friday',
    date: '30 ene 2026',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 12,
    image: '/events/event-12.webp',
    title: 'Stellar Summer Friday',
    date: '30 ene 2026',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 13,
    image: '/events/event-13.webp',
    title: 'Stellar Summer Friday',
    date: '30 ene 2026',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 14,
    image: '/events/event-14.webp',
    title: 'Stellar Summer Friday',
    date: '30 ene 2026',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 15,
    image: '/events/event-15.webp',
    title: 'Stellar Summer Friday',
    date: '30 ene 2026',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 16,
    image: '/events/event-16.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 17,
    image: '/events/event-17.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 18,
    image: '/events/event-18.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 19,
    image: '/events/event-19.webp',
    title: 'CURSOR',
    date: '16 dic 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 20,
    image: '/events/event-20.webp',
    title: 'Hackathon Aleph',
    date: '23 ago 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 21,
    image: '/events/event-21.webp',
    title: 'Hackathon Aleph',
    date: '23 ago 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 22,
    image: '/events/event-22.webp',
    title: 'Hackathon Aleph',
    date: '23 ago 2025',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 23,
    image: '/events/event-23.webp',
    title: 'Stellar Summer Friday',
    date: '30 ene 2026',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 24,
    image: '/events/event-24.webp',
    title: 'Stellar Summer Friday',
    date: '30 ene 2026',
    href: INSTAGRAM_URL,
  },
  {
    published: true,
    order: 25,
    image: '/events/event-25.webp',
    title: 'Stellar Summer Friday',
    date: '30 ene 2026',
    href: INSTAGRAM_URL,
  },
]
