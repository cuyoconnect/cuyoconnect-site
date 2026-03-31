/**
 * Ancho máximo de la columna de contenido (mismo criterio que el PNG del hero).
 * Usar dentro de un padre que ya tenga padding horizontal de página (p. ej. px-4 sm:px-6).
 *
 * `calc(100vw - 3rem)`: en sm+ el padding suele ser px-6 a cada lado (1.5rem + 1.5rem = 3rem),
 * así el ancho fluido no se sale del viewport.
 */
export const HERO_CONTENT_WIDTH_CLASS =
  'w-full max-w-full max-sm:max-w-none sm:mx-auto sm:w-[clamp(22rem,min(calc(100vw-3rem),48rem),48rem)] md:w-[min(100%,46rem)] md:max-w-[46rem] lg:w-[min(100%,52rem)] lg:max-w-[52rem]' as const

/**
 * Carril de texto / bloques de página un poco más ancho que el hero (+15 % en los topes).
 * La cúpula usa `DOME_STAGE_WIDTH_CLASS`, no esto.
 */
export const SECTION_CONTENT_WIDTH_CLASS =
  'mx-auto w-full min-w-0 max-w-full sm:w-[clamp(22rem,min(calc(100vw-3rem),55.2rem),55.2rem)] sm:max-w-[55.2rem] md:w-[min(100%,52.9rem)] md:max-w-[52.9rem] lg:w-[min(100%,59.8rem)] lg:max-w-[59.8rem]' as const

/** Misma columna que las secciones de contenido (un poco más ancha que el hero). */
export const DOME_STAGE_WIDTH_CLASS = SECTION_CONTENT_WIDTH_CLASS
