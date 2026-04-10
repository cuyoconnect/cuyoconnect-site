import type { FAQItem } from '@/components/ui/faq-chat-accordion'
import { requestOpenJoinCommunityModal } from '@/lib/join-community-modal-request'

const joinModalLinkClass =
  'font-semibold underline underline-offset-2 decoration-neutral-400 hover:decoration-neutral-900 transition-colors focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400'

const SPEAKER_MAILTO =
  'mailto:cuyoconnect@gmail.com?subject=Quiero%20ser%20speaker%20-%20CuyoConnect'

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
      'No, participar de la comunidad es completamente gratis. Si alguna actividad tuviera costo, lo vamos a comunicar con anticipación.',
  },
  {
    id: 3,
    question: '¿Dónde me entero de las novedades?',
    answer: (
      <>
        Publicamos todo en nuestras redes y canales.{' '}
        <button
          type="button"
          className={joinModalLinkClass}
          aria-label="Abrir enlaces y canales de la comunidad (Unite)"
          onClick={() => requestOpenJoinCommunityModal()}
        >
          Unite acá
        </button>{' '}
        para no perderte nada.
      </>
    ),
  },
  {
    id: 4,
    question: '¿Puedo proponer una charla o tema?',
    answer: (
      <>
        Sí, nos encanta sumar nuevas voces. Escribinos a{' '}
        <a href={SPEAKER_MAILTO} className={joinModalLinkClass}>
          cuyoconnect@gmail.com
        </a>{' '}
        y coordinamos.
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
