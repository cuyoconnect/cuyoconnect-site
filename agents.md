# Guía para agentes (CuyoConnect)

## Ancho de columna y hero

- La columna de contenido del **hero** se define con `HERO_CONTENT_WIDTH_CLASS` en `src/lib/content-width.ts`. Replica el ancho del arte PNG del hero (topes en `sm` / `md` / `lg` y `calc(100vw - 3rem)` donde aplica).
- Las secciones que deben **alinearse visualmente con el hero** (misma columna máxima) deben usar **`HERO_CONTENT_WIDTH_CLASS`** en su contenedor interno, no `SECTION_CONTENT_WIDTH_CLASS`.
- **`SECTION_CONTENT_WIDTH_CLASS`** es ~15% más ancho; úsalo solo cuando la sección deba ser deliberadamente más ancha que el hero (p. ej. galería / cúpula según el código actual). 
- La sección **Equipo** (`src/TeamSection.tsx`) usa `HERO_CONTENT_WIDTH_CLASS` para el bloque de título y la grilla de miembros, con `min-w-0` donde hace falta para que la grilla no desborde el ancho.  
- El padre de la columna debe llevar padding horizontal de página coherente (p. ej. `px-4 sm:px-6`), igual que en otras secciones.
- **Pie de página** (`src/SiteFooter.tsx`): el `<footer>` va sin padding/margin extra (`p-0`, sin `pt-*` ni `px-*` en el propio footer). Fondo **blanco** como el resto de la página (sin imagen ni tonos grises de relleno). El contenedor `#footer-surface` es ancho completo; el contenido usa `px-4 sm:px-6` + `HERO_CONTENT_WIDTH_CLASS` centrado, igual que el ritmo horizontal del hero.
 
