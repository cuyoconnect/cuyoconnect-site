import { SpeakerCallPoster } from '@/components/speakers/SpeakerCallPoster'
import { SideCircuitDecor } from '@/components/SideCircuitDecor'
import { cn } from '@/lib/utils'

export function SpeakerCallPosterPage() {
  return (
    <div
      className={cn(
        'relative isolate flex min-h-dvh items-center justify-center overflow-x-clip bg-white px-4 pb-8',
        'pt-[calc(6.5rem+env(safe-area-inset-top,0px))]',
        'text-neutral-950 [color-scheme:light]',
        'sm:px-6 sm:pb-10 sm:pt-[calc(7rem+env(safe-area-inset-top,0px))]',
      )}
    >
      <SideCircuitDecor />
      <h1 className="sr-only">¿Querés ser speaker?</h1>
      <div className="relative z-10 w-full max-w-[24rem] sm:max-w-[28rem]">
        <SpeakerCallPoster />
      </div>
    </div>
  )
}
