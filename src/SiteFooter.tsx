import { SectionLabel } from '@/components/SectionLabel'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { cn } from '@/lib/utils'

const CONTACT_EMAIL = 'cuyoconnect@gmail.com'

const footerNavLinkClass = cn(
  'inline-flex shrink-0 whitespace-nowrap rounded-[10px] font-medium transition',
  'hover:bg-black/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400',
  'px-2 py-2 text-xs text-neutral-800 hover:text-neutral-950 sm:px-3 sm:text-sm',
)

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  )
}

export function SiteFooter() {
  return (
    <footer
      className={cn(
        'm-0 w-full overflow-x-clip bg-white p-0',
        'text-neutral-950 [color-scheme:light]',
        'pb-[max(1.5rem,env(safe-area-inset-bottom))]',
      )}
      aria-labelledby="footer-heading"
    >
      <div
        id="footer-surface"
        className="flex w-full min-w-0 flex-col items-stretch bg-white"
      >
        <div className="w-full px-4 sm:px-6">
          <div className={cn('mx-auto flex min-w-0 flex-col', HERO_CONTENT_WIDTH_CLASS)}>
            <div className="flex flex-col py-12 sm:py-16">
              <SectionLabel className="mb-0">Contacto</SectionLabel>
              <h2
                id="footer-heading"
                className="mt-3 text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl md:text-4xl"
              >
                Sigamos la conversación
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-neutral-600 sm:mt-4 sm:text-lg">
                Si querés sumarte, proponer algo o charlar un rato, mandanos un mail.
                Leemos todo.
              </p>

              <div className="mt-8 sm:mt-10">
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Hola%20CuyoConnect`}
                  className={cn(
                    'group inline-flex max-w-full items-center gap-2 rounded-2xl border border-neutral-200/80',
                    'bg-white px-4 py-3 font-semibold text-neutral-950 transition',
                    'hover:border-neutral-300 hover:bg-neutral-50',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400',
                  )}
                >
                  <span
                    className={cn(
                      'min-w-0 break-words underline decoration-[#ffec6b] decoration-[0.22em] decoration-solid underline-offset-[0.28em]',
                      'transition group-hover:decoration-neutral-950/25',
                    )}
                  >
                    {CONTACT_EMAIL}
                  </span>
                  <ArrowUpRightIcon className="size-4 shrink-0 text-neutral-600 transition group-hover:text-neutral-950" />
                </a>
              </div>

              <div
                className={cn(
                  'mt-12 flex flex-col gap-6 border-t border-neutral-200/80 pt-8',
                  'sm:flex-row sm:items-center sm:justify-between',
                )}
              >
                <p className="order-2 text-xs text-neutral-500 sm:order-1">
                  © {new Date().getFullYear()} CuyoConnect
                </p>
                <nav
                  className="order-1 flex flex-wrap gap-1 sm:order-2 sm:justify-end sm:gap-0 sm:gap-x-1"
                  aria-label="Pie de página"
                >
                  <a href="#inicio" className={footerNavLinkClass}>
                    Inicio
                  </a>
                  <a href="#nuestros-eventos" className={footerNavLinkClass}>
                    Eventos
                  </a>
                  <a href="#eventos" className={footerNavLinkClass}>
                    Calendario
                  </a>
                  <a href="#equipo" className={footerNavLinkClass}>
                    Equipo
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
