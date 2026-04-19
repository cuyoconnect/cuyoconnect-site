# CuyoConnect

Sitio estático en Astro con islas React para conservar la interacción existente.

## Scripts

- `npm run dev`: inicia Astro en desarrollo. 
- `npm run build`: genera el sitio estático en `dist/`. 
- `npm run preview`: sirve el build localmente.
- `npm run lint`: corre ESLint sobre `ts` y `tsx` del proyecto.  
   
## Rutas
  
- `/`: landing principal.
- `/recursos`: archivo de recursos y materiales.
- `/eventos`: landing con scroll inicial a la sección de eventos.
- `/miembros`: landing con scroll inicial a la sección de miembros.

## Variables de entorno

Variables públicas recomendadas:

- `PUBLIC_SITE_URL`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Compatibilidad transicional mantenida:

- `VITE_SITE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## Notas de arquitectura

- Astro se encarga del routing, metadata y salida estática.
- React queda solo en las secciones que hoy necesitan estado cliente, animaciones, drag, modal o Supabase.
- No se usan View Transitions en esta primera migración.
