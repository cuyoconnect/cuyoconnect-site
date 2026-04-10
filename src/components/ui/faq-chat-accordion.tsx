import * as React from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface FAQItem {
  id: number
  question: string
  answer: React.ReactNode
  icon?: string
  iconPosition?: 'left' | 'right'
}

export interface FaqAccordionProps {
  data: FAQItem[]
  className?: string
  timestamp?: string
  questionClassName?: string
  answerClassName?: string
}

export function FaqAccordion({
  data,
  className,
  questionClassName,
  answerClassName,
}: FaqAccordionProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(null)

  return (
    <Accordion.Root
      type="single"
      collapsible
      value={openItem ?? ''}
      onValueChange={(value) => setOpenItem(value || null)}
      className={cn('divide-y divide-neutral-200', className)}
    >
      {data.map((item) => {
        const isOpen = openItem === item.id.toString()

        return (
          <Accordion.Item
            value={item.id.toString()}
            key={item.id}
          >
            <Accordion.Header>
              <Accordion.Trigger
                className={cn(
                  'group flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium text-neutral-900 transition-colors hover:text-neutral-600',
                  'sm:text-lg',
                  questionClassName,
                )}
              >
                <span className="min-w-0">{item.question}</span>
                <motion.span
                  className="shrink-0 text-neutral-400"
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <Plus className="h-5 w-5" strokeWidth={1.5} />
                </motion.span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content asChild forceMount>
              <motion.div
                initial="collapsed"
                animate={isOpen ? 'open' : 'collapsed'}
                variants={{
                  open: { opacity: 1, height: 'auto' },
                  collapsed: { opacity: 0, height: 0 },
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    'pb-5 pr-10 text-[0.9375rem] leading-relaxed text-neutral-500',
                    'sm:text-base',
                    answerClassName,
                  )}
                >
                  {item.answer}
                </div>
              </motion.div>
            </Accordion.Content>
          </Accordion.Item>
        )
      })}
    </Accordion.Root>
  )
}
