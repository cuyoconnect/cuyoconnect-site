import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'motion/react'

import { ABOUT_GRID_ITEMS } from '@/data/about-grid'
import { HERO_CONTENT_WIDTH_CLASS } from '@/lib/content-width'
import { HERO_TOPIC_HIGHLIGHT } from '@/lib/hero-topic-highlight'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const ABOUT_HEADING = 'QUIÉNES SOMOS'

const ABOUT_COPY =
  'Nacimos en Cuyo con una idea simple: la distancia no debería ser un límite para quienes construyen tecnología. Conectamos personas, ideas y proyectos - porque las mejores cosas se crean juntos.'

const GRID_COLUMN_COUNT = 3

function groupItemsByColumn(items: HTMLLIElement[]) {
  const columns = Array.from({ length: GRID_COLUMN_COUNT }, () => [] as HTMLLIElement[])
  items.forEach((item, index) => {
    columns[index % GRID_COLUMN_COUNT]?.push(item)
  })
  return columns
}

export function AboutStickyGridSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const copyRef = useRef<HTMLParagraphElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const reduceMotion = useReducedMotion()

  useLayoutEffect(() => {
    if (reduceMotion) return

    const section = sectionRef.current
    const sticky = stickyRef.current
    const grid = gridRef.current
    const content = contentRef.current
    const heading = headingRef.current
    const copy = copyRef.current
    const items = itemRefs.current.filter(
      (item): item is HTMLLIElement => item !== null,
    )
    const images = items
      .map((item) => item.querySelector('img'))
      .filter((image): image is HTMLImageElement => image !== null)

    if (
      !section ||
      !sticky ||
      !grid ||
      !content ||
      !heading ||
      !copy ||
      items.length === 0
    ) {
      return
    }

    let refreshRaf = 0
    let refreshNestedRaf = 0

    const scheduleRefresh = () => {
      if (refreshRaf || refreshNestedRaf) return

      refreshRaf = window.requestAnimationFrame(() => {
        refreshRaf = 0
        refreshNestedRaf = window.requestAnimationFrame(() => {
          refreshNestedRaf = 0
          ScrollTrigger.refresh()
        })
      })
    }

    const ctx = gsap.context(() => {
      const columns = groupItemsByColumn(items)
      const centerColumn = columns[1] ?? []
      const viewportWidth = sticky.offsetWidth
      const isMobile = viewportWidth < 640
      const isTablet = viewportWidth >= 640 && viewportWidth < 1024
      const revealStart = 0
      const zoomStart = 0.34
      const contentShiftStart = 0.84
      const centerShiftStart = 0.92
      const copyStart = 1.26
      const initialGridScale = isMobile ? 0.94 : isTablet ? 0.93 : 0.92
      const desktopFinalGridScale = gsap.utils.clamp(
        1.32,
        1.42,
        (sticky.offsetHeight * 1.68) / Math.max(grid.offsetHeight, 1),
      )
      const finalGridScale = isMobile
        ? 1.28
        : isTablet
          ? 1.38
          : desktopFinalGridScale
      const sideColumnOffsetX = isMobile ? 5 : isTablet ? 14 : 28
      const centerColumnOffsetY = isMobile ? 16 : isTablet ? 20 : 24
      const scrubAmount = isMobile ? 0.42 : isTablet ? 0.46 : 0.52
      const contentCenterBiasY = sticky.offsetHeight * (isMobile ? 0.04 : isTablet ? 0.02 : -0.02)
      const revealDistance = Math.max(
        sticky.offsetHeight * 0.46,
        grid.offsetHeight * 0.28,
      )
      const stickyRect = sticky.getBoundingClientRect()
      const headingRect = heading.getBoundingClientRect()
      const contentRect = content.getBoundingClientRect()
      const stickyTopOffset = Math.max(
        0,
        (window.innerHeight - sticky.offsetHeight) / 2 - 12,
      )
      const headingCenterY =
        headingRect.top - stickyRect.top + headingRect.height / 2
      const contentCenterY =
        contentRect.top - stickyRect.top + contentRect.height / 2
      const stickyCenterY = stickyRect.height / 2
      const targetContentY = gsap.utils.clamp(
        sticky.offsetHeight * 0.14,
        sticky.offsetHeight * 0.46,
        stickyCenterY - contentCenterY + contentCenterBiasY,
      )
      const finalHeadingCenterY = headingCenterY + targetContentY
      const finalContentCenterY = contentCenterY + targetContentY
      const focusCenterY =
        finalHeadingCenterY +
        (finalContentCenterY - finalHeadingCenterY) * 0.52
      const animationScrollDistance = () =>
        Math.max(1, section.offsetHeight - sticky.offsetHeight)
      const targetGridY = gsap.utils.clamp(
        -sticky.offsetHeight * 0.38,
        -sticky.offsetHeight * 0.12,
        focusCenterY - stickyCenterY,
      )
      const startGridY = targetGridY * 0.14

      gsap.set(grid, {
        y: startGridY,
        scale: initialGridScale,
        transformOrigin: '50% 50%',
      })
      gsap.set(content, { autoAlpha: 1, y: 0 })
      gsap.set(heading, { autoAlpha: 0.9, y: 0 })
      gsap.set(copy, { autoAlpha: 0, y: 18 })

      columns.forEach((column, columnIndex) => {
        if (column.length === 0) return

        const fromTop = columnIndex % 2 === 0

        gsap.set(column, {
          y: revealDistance * (fromTop ? -1 : 1),
        })
      })

      const timeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: section,
          start: () => `top ${stickyTopOffset}px`,
          end: () => `+=${animationScrollDistance()}`,
          invalidateOnRefresh: true,
          scrub: scrubAmount,
        },
      })

      columns.forEach((column, columnIndex) => {
        if (column.length === 0) return

        const fromTop = columnIndex % 2 === 0

        timeline.to(
          column,
          {
            y: 0,
            stagger: {
              each: 0.06,
              from: fromTop ? 'end' : 'start',
            },
            duration: 1.16,
          },
          revealStart,
        )
      })

      timeline.to(
        grid,
        {
          y: targetGridY,
          scale: finalGridScale,
          duration: 1.08,
          ease: 'power3.inOut',
        },
        zoomStart,
      )

      if (columns[0]?.length) {
        timeline.to(
          columns[0],
          {
            xPercent: -sideColumnOffsetX,
            duration: 1.02,
            ease: 'power3.inOut',
          },
          zoomStart,
        )
      }

      if (columns[2]?.length) {
        timeline.to(
          columns[2],
          {
            xPercent: sideColumnOffsetX,
            duration: 1.02,
            ease: 'power3.inOut',
          },
          zoomStart,
        )
      }

      if (centerColumn.length > 0) {
        timeline.to(
          centerColumn,
          {
            yPercent: (index) =>
              index < Math.ceil(centerColumn.length / 2)
                ? -centerColumnOffsetY
                : centerColumnOffsetY,
            duration: 0.52,
            ease: 'power1.inOut',
          },
          centerShiftStart,
        )
      }

      timeline.to(
        content,
        {
          y: targetContentY,
          duration: 0.72,
          ease: 'power2.inOut',
        },
        contentShiftStart,
      )

      timeline.to(
        heading,
        {
          autoAlpha: 1,
          duration: 0.16,
          ease: 'power1.out',
        },
        0,
      )

      timeline.to(
        copy,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          ease: 'power2.out',
        },
        copyStart,
      )
    }, section)

    scheduleRefresh()

    const handleImageReady = () => {
      scheduleRefresh()
    }

    images.forEach((image) => {
      if (image.complete) return

      image.addEventListener('load', handleImageReady)
      image.addEventListener('error', handleImageReady)
    })

    return () => {
      images.forEach((image) => {
        image.removeEventListener('load', handleImageReady)
        image.removeEventListener('error', handleImageReady)
      })

      if (refreshRaf) {
        window.cancelAnimationFrame(refreshRaf)
      }

      if (refreshNestedRaf) {
        window.cancelAnimationFrame(refreshNestedRaf)
      }

      ctx.revert()
    }
  }, [reduceMotion])

  return (
    <section
      ref={sectionRef}
      id="quienes-somos"
      className={cn(
        'about-sticky-section relative overflow-x-clip bg-white text-neutral-950 [color-scheme:light]',
        reduceMotion && 'about-sticky-section--reduced',
      )}
      aria-labelledby="quienes-somos-heading"
    >
      <div ref={stickyRef} className="about-sticky-wrapper">
        <div className="about-sticky-gallery" aria-hidden="true">
          <ul ref={gridRef} className="about-sticky-grid">
            {ABOUT_GRID_ITEMS.map((item, index) => (
              <li
                key={item.src}
                ref={(element) => {
                  itemRefs.current[index] = element
                }}
                className="about-sticky-item"
              >
                <img
                  src={item.src}
                  alt=""
                  width={720}
                  height={720}
                  loading="lazy"
                  decoding="async"
                  className="about-sticky-image"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="about-sticky-gallery-fade" aria-hidden="true" />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-24 sm:px-6 sm:pt-28 md:pt-32">
          <div
            ref={contentRef}
            className={cn(
              'pointer-events-auto relative isolate mx-auto w-full text-center',
              HERO_CONTENT_WIDTH_CLASS,
            )}
          >
            <h2
              ref={headingRef}
              id="quienes-somos-heading"
              className="relative z-10 text-balance text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl md:text-5xl"
            >
              <span
                className="inline-block rounded-[0.38em] px-[0.3em] py-[0.08em]"
                style={{ backgroundColor: HERO_TOPIC_HIGHLIGHT }}
              >
                {ABOUT_HEADING}
              </span>
            </h2>
            <p
              ref={copyRef}
              className="relative z-10 mx-auto mt-4 max-w-3xl rounded-[1.4rem] px-4 py-3 text-pretty text-base leading-relaxed text-neutral-900 sm:mt-5 sm:px-5 sm:py-4 sm:text-lg md:text-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(14px) saturate(1.08)',
                WebkitBackdropFilter: 'blur(14px) saturate(1.08)',
              }}
            >
              {ABOUT_COPY}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
