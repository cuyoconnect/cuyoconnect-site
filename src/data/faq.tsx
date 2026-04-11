import type { FAQItem } from '@/components/ui/faq-chat-accordion'
import { INLINE_LINK_UNDERLINE_CLASS } from '@/lib/inline-link'
import { requestOpenJoinCommunityModal } from '@/lib/join-community-modal-request'

/** Página de propuestas de charla (producción). */
const SPEAKERS_PAGE_URL = 'https://cuyoconnect.com/speakers'

export const LANDING_FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    question: '¿Necesito experiencia para participar?',
    answer:
      'Para nada. Hay gente de todos los niveles y roles. Llegar recién arrancando es lo más común, y entre todos nos damos una mano para crecer.',
  },
  {
    id: 2,
    question: '¿Es gratis?',
    answer:
      'Sí, participar de la comunidad es completamente gratis. Si alguna actividad tuviera costo, lo vamos a comunicar con anticipación.',
  },
  {
    id: 3,
    question: '¿Cómo puedo unirme?',
    answer: (
      <>
        Reunimos los enlaces en un solo lugar.{' '}
        <button
          type="button"
          className={INLINE_LINK_UNDERLINE_CLASS}
          aria-label="Abrir enlaces y canales de la comunidad (Unite)"
          onClick={() => requestOpenJoinCommunityModal()}
        >
          Unite acá
        </button>{' '}
        para abrirlos y elegir por dónde querés participar.
      </>
    ),
  },
  {
    id: 4,
    question: '¿Puedo proponer una charla o tema?',
    answer: (
      <>
        Sí, nos encanta sumar nuevas voces.{' '}
        <a
          href={SPEAKERS_PAGE_URL}
          className={INLINE_LINK_UNDERLINE_CLASS}
          target="_blank"
          rel="noopener noreferrer"
        >
          Hacé clic aquí
        </a>{' '}
        para enviar tu propuesta.
      </>
    ),
  },
  {
    id: 5,
    question: '¿Puedo compartir mi proyecto o emprendimiento?',
    answer:
      'Por supuesto. Nos interesa dar visibilidad a lo que la comunidad construye, ya sean proyectos personales, side projects o emprendimientos.',
  },
]
