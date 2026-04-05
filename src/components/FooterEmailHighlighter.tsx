import { Highlighter } from '@/components/ui/highlighter'
import { HERO_TOPIC_HIGHLIGHT } from '@/lib/hero-topic-highlight'

export default function FooterEmailHighlighter({
  email,
}: {
  email: string
}) {
  return (
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
      {email}
    </Highlighter>
  )
}
