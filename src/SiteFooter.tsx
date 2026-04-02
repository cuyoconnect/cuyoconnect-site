import { Highlighter } from '@/components/ui/highlighter'
import { SectionLabel } from '@/components/SectionLabel'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { HERO_TOPIC_HIGHLIGHT } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

const CONTACT_EMAIL = 'cuyoconnect@gmail.com'
const FOOTER_HEADING = 'Sigamos la conversación'

const FOOTER_SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/cuyoconnect/',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/cuyoconnect/',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'X',
    href: 'https://x.com/CuyoConnect',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
] as const

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
            <svg
              className="w-full text-neutral-300/70"
              viewBox="0 0 1200 20"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="divider-fade" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                  <stop offset="15%" stopColor="currentColor" stopOpacity="1" />
                  <stop offset="85%" stopColor="currentColor" stopOpacity="1" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 12c35-8 70-12 115-4s75 14 120 6 68-14 112-5 72 13 118 4 65-13 108-5 74 12 120 4 66-12 110-4 72 11 117 3 68-9 130-2"
                stroke="url(#divider-fade)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col py-12 sm:py-16">
              <h2
                id="footer-heading"
                className="mt-3 text-balance text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl md:text-4xl"
              >
                {FOOTER_HEADING}
              </h2>
              <p className="mt-3 max-w-2xl text-pretty text-neutral-600 sm:mt-4 sm:text-lg">
                Si querés sumarte, proponer algo o charlar un rato, mandanos un mail.
                Leemos todo.
              </p>

              <div className="mt-8 flex justify-center sm:mt-10">
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Hola%20CuyoConnect`}
                  className={cn(
                    'inline-flex max-w-full items-center rounded-2xl',
                    'bg-white px-5 py-4 text-xl font-semibold text-neutral-950 transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:duration-[240ms] hover:delay-0',
                    'sm:px-6 sm:py-4 sm:text-2xl',
                    'hover:bg-neutral-50',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400',
                  )}
                >
                  <Highlighter
                    className="min-w-0 break-words [&::selection]:bg-[#ffec6b] [&::selection]:text-neutral-950"
                    color={HERO_TOPIC_HIGHLIGHT}
                    strokeWidth={2.15}
                    animationDuration={1500}
                    iterations={4}
                    padding={6}
                    multiline
                    isView
                  >
                    {CONTACT_EMAIL}
                  </Highlighter>
                </a>
              </div>

              <div
                className={cn(
                  'mt-12 flex flex-col gap-6 pt-8',
                  'sm:flex-row sm:items-center sm:justify-between',
                )}
              >
                <p className="order-2 text-xs text-neutral-500 sm:order-1">
                  © {new Date().getFullYear()} CuyoConnect
                </p>
                <nav
                  className="order-1 flex items-center gap-1 sm:order-2 sm:justify-end"
                  aria-label="Redes sociales"
                >
                  {FOOTER_SOCIALS.map(({ label, href, path }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={cn(
                        'inline-flex items-center justify-center rounded-[10px] p-2 text-neutral-400',
                        'transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:duration-[240ms] hover:delay-0',
                        'hover:text-neutral-900',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400',
                      )}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d={path} />
                      </svg>
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
