import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

import { CommunityBrandIcon } from '@/components/CommunityBrandIcon'
import { COMMUNITY_LINKS, openCommunityLink } from '@/lib/community-links'
import { cn } from '@/lib/utils'

type JoinCommunityModalProps = {
  open: boolean
  onClose: () => void
}

export function JoinCommunityModal({ open, onClose }: JoinCommunityModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 max-h-[min(36rem,min(90dvh,calc(100dvh-2rem)))] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-lg',
        )}
      >
        <div className="flex max-h-[min(36rem,min(90dvh,calc(100dvh-2rem)))] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight text-neutral-950"
              >
                Elegí dónde conectar
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Abrimos una pestaña nueva con el enlace que elijas.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-[10px] p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              aria-label="Cerrar"
              onClick={onClose}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="min-h-0 flex-1 list-none overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
            {COMMUNITY_LINKS.map(({ id, label, href }) => (
              <li key={id} className="border-b border-neutral-100 last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-3.5 text-left text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                  onClick={() => {
                    openCommunityLink(href)
                    onClose()
                  }}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100"
                      aria-hidden
                    >
                      <CommunityBrandIcon id={id} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 truncate">{label}</span>
                  </span>
                  <svg
                    className="h-4 w-4 shrink-0 text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M7 17 17 7M7 7h10v10" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  )
}
