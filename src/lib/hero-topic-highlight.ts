import type { BlurTextTailHighlight } from '@/components/ui/blur-text'

/** Mismo tono que el resaltado del hero (marcador). */
export const HERO_TOPIC_HIGHLIGHT = '#ffec6b'

/** Configuración compartida del marcador rough-notation (hero y títulos alineados al hero). */
export function heroTopicTailHighlight(
  lastWordCount: number,
): BlurTextTailHighlight {
  return {
    lastWordCount,
    color: HERO_TOPIC_HIGHLIGHT,
    strokeWidth: 2.15,
    padding: 5,
    multiline: true,
    animationDuration: 1500,
    iterations: 4,
    className:
      '[&::selection]:bg-[#ffec6b] [&::selection]:text-neutral-950',
  }
}

/** Una sola palabra del texto (0 = primera) con el mismo estilo de marcador. */
export function heroTopicHighlightWord(
  wordIndex: number,
): BlurTextTailHighlight {
  return {
    lastWordCount: 0,
    highlightWordIndex: wordIndex,
    color: HERO_TOPIC_HIGHLIGHT,
    strokeWidth: 2.15,
    padding: 5,
    multiline: true,
    animationDuration: 1500,
    iterations: 4,
    className:
      '[&::selection]:bg-[#ffec6b] [&::selection]:text-neutral-950',
  }
}
