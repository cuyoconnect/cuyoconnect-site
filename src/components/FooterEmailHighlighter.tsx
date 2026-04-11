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
      action="underline"
      color={HERO_TOPIC_HIGHLIGHT}
      strokeWidth={4.1}
      wavyCycles={4}
      wavyAmplitudePx={3.6}
      animationDuration={1100}
      iterations={1}
      padding={1}
      multiline
      wavy
      isView
    >
      {email}
    </Highlighter>
  )
}
