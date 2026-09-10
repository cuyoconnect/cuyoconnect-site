/** Paleta CuyoConnect. Misma fuente que los tokens `--color-*` de `index.css`. */
export const PALETTE = {
  ink: '#1d1d1f',
  inkSoft: '#3f3f42',
  inkForeground: '#f4f0e6',
  inkMuted: '#c8c2b4',
  paper: '#f6f2e6',
  sun: '#ffec6b',
  sunDeep: '#e8c94a',
  dusk: '#4a6f9c',
  duskMuted: '#d5dfec',
  mint: '#d7f3d2',
  blush: '#ffd9df',
  lilac: '#d9d2ff',
  sky: '#c5f0ff',
} as const

export type PaletteName = keyof typeof PALETTE
