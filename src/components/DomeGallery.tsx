import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { openCommunityLink } from '@/lib/community-links';

type ImageItem =
  | string
  | {
      id?: string;
      src: string;
      alt?: string;
      title?: string;
      subtitle?: string;
      slug?: string;
      href?: string;
      hrefLabel?: string;
      date?: string;
    };

type DomeGalleryProps = {
  images?: ImageItem[];
  fit?: number;
  fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  /** Multiplica el alto del contenedor para tope del radio (por defecto 1.35; subir si el domo queda “chico”). */
  heightGuardFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  autoRotationSpeed?: number;
  /**
   * Si se define, tap/clic abre esta URL en una pestaña nueva en lugar del visor ampliado.
   */
  tileTapExternalHref?: string;
  /** Accesible: solo aplica cuando hay `tileTapExternalHref`. */
  tileTapAriaLabel?: string;
};

type ItemDef = {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
  slug?: string;
  href?: string;
  hrefLabel?: string;
  date?: string;
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
};

const DEFAULT_IMAGES: ImageItem[] = [
  {
    src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop',
    alt: 'Abstract art'
  },
  {
    src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop',
    alt: 'Modern sculpture'
  },
  {
    src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop',
    alt: 'Digital artwork'
  },
  {
    src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop',
    alt: 'Contemporary art'
  },
  {
    src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop',
    alt: 'Geometric pattern'
  },
  {
    src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop',
    alt: 'Textured surface'
  },
  {
    src: 'https://pbs.twimg.com/media/Gyla7NnXMAAXSo_?format=jpg&name=large',
    alt: 'Social media image'
  }
];

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

type GestureDragEvent = MouseEvent | PointerEvent | TouchEvent;

const getGesturePoint = (event: GestureDragEvent) => {
  if ('touches' in event && event.touches.length > 0) {
    const touch = event.touches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  if ('changedTouches' in event && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  if ('clientX' in event && 'clientY' in event) {
    return { x: event.clientX, y: event.clientY };
  }
  return null;
};

const getGesturePointerType = (event: GestureDragEvent): 'mouse' | 'pen' | 'touch' => {
  if ('pointerType' in event) {
    const pointerType = event.pointerType;
    if (pointerType === 'mouse' || pointerType === 'pen' || pointerType === 'touch') {
      return pointerType;
    }
  }
  if ('touches' in event || 'changedTouches' in event) return 'touch';
  return 'mouse';
};

type NormalizedTile = {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
  slug?: string;
  href?: string;
  hrefLabel?: string;
  date?: string;
};

function domeTileMixSeed(totalSlots: number, poolLen: number, identityKey: string): number {
  let h = 0xc0da11 ^ poolLen * 0x9e3779b9;
  for (let i = 0; i < identityKey.length; i++) {
    h = Math.imul(h ^ identityKey.charCodeAt(i), 16777619);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h ^= totalSlots * 1597334677;
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t >>> 0) / 4294967296;
  };
}

function shuffleIndicesInPlace(indices: number[], rand: () => number) {
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
}

const DOME_COL_ROWS = 5;

/** Tiles prohibidos para la fila k de la columna actual (prev = columna ya colocada). */
function domeColumnForbiddenIds(prevCol: NormalizedTile[] | null, k: number): string[] {
  if (!prevCol) return [];
  const out = [prevCol[k]!.id];
  if (k === 0) out.push(prevCol[DOME_COL_ROWS - 1]!.id);
  return out;
}

function pickDistinctColumn(
  uniqueTiles: NormalizedTile[],
  prevCol: NormalizedTile[] | null,
  rand: () => number,
  quotaLeft: Map<string, number>,
): NormalizedTile[] | null {
  const used = new Set<string>();
  const picked: NormalizedTile[] = [];

  const dfs = (k: number): boolean => {
    if (k === DOME_COL_ROWS) return true;
    const forbidden = domeColumnForbiddenIds(prevCol, k);
    const cand = uniqueTiles.filter(
      t =>
        !used.has(t.id) &&
        !forbidden.includes(t.id) &&
        (quotaLeft.get(t.id) ?? 0) > 0,
    );
    if (cand.length === 0) return false;

    const order = cand.map((_, i) => i);
    shuffleIndicesInPlace(order, rand);
    order.sort(
      (a, b) =>
        (quotaLeft.get(cand[b]!.id) ?? 0) - (quotaLeft.get(cand[a]!.id) ?? 0) || rand() - 0.5,
    );

    for (const o of order) {
      const t = cand[o]!;
      used.add(t.id);
      picked[k] = t;
      quotaLeft.set(t.id, (quotaLeft.get(t.id) ?? 0) - 1);
      if (dfs(k + 1)) return true;
      quotaLeft.set(t.id, (quotaLeft.get(t.id) ?? 0) + 1);
      used.delete(t.id);
    }
    return false;
  };

  return dfs(0) ? picked : null;
}

function fillColumnFallback(
  uniqueTiles: NormalizedTile[],
  prevCol: NormalizedTile[] | null,
  rand: () => number,
  quotaLeft: Map<string, number>,
): NormalizedTile[] {
  const used = new Set<string>();
  const res: NormalizedTile[] = [];
  for (let k = 0; k < DOME_COL_ROWS; k++) {
    const forbidden = new Set(domeColumnForbiddenIds(prevCol, k));
    const pick = uniqueTiles.filter(t => !used.has(t.id) && !forbidden.has(t.id));
    const preferred = pick.filter(t => (quotaLeft.get(t.id) ?? 0) > 0);
    const candidates = preferred.length > 0 ? preferred : pick;
    const order = candidates.map((_, i) => i);
    shuffleIndicesInPlace(order, rand);
    order.sort(
      (a, b) =>
        (quotaLeft.get(candidates[b]!.id) ?? 0) -
          (quotaLeft.get(candidates[a]!.id) ?? 0) ||
        rand() - 0.5,
    );
    const t =
      candidates.length > 0
        ? candidates[order[0]!]!
        : (uniqueTiles.find(x => !used.has(x.id)) ?? uniqueTiles[0]!);
    res.push(t);
    used.add(t.id);
    quotaLeft.set(t.id, (quotaLeft.get(t.id) ?? 0) - 1);
  }
  return res;
}

function buildColumnMajorBalancedGrid(
  normalized: NormalizedTile[],
  numCols: number,
  seed: number,
): NormalizedTile[] {
  const byId = new Map<string, NormalizedTile>();
  for (const t of normalized) {
    if (!byId.has(t.id)) byId.set(t.id, t);
  }
  const uniqueTiles = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const u = uniqueTiles.length;
  const totalSlots = numCols * DOME_COL_ROWS;
  const out: NormalizedTile[] = new Array(totalSlots);

  if (u < DOME_COL_ROWS) {
    for (let i = 0; i < totalSlots; i++) {
      out[i] = normalized[i % normalized.length]!;
    }
    return out;
  }

  const q = Math.floor(totalSlots / u);
  const r = totalSlots % u;
  const perm = Array.from({ length: u }, (_, i) => i);
  shuffleIndicesInPlace(perm, mulberry32(seed ^ 0x51ee));
  const extraOne = new Set<number>();
  for (let x = 0; x < r; x++) {
    extraOne.add(perm[x]!);
  }
  const initQuota = new Map<string, number>();
  for (let i = 0; i < u; i++) {
    const t = uniqueTiles[i]!;
    initQuota.set(t.id, q + (extraOne.has(i) ? 1 : 0));
  }

  for (let c = 0; c < numCols; c++) {
    const prevCol =
      c === 0
        ? null
        : (Array.from({ length: DOME_COL_ROWS }, (_, k) => out[(c - 1) * DOME_COL_ROWS + k]) as NormalizedTile[]);

    let col: NormalizedTile[] | null = null;
    for (let attempt = 0; attempt < 48; attempt++) {
      const quotaSnap = new Map(initQuota);
      col = pickDistinctColumn(
        uniqueTiles,
        prevCol,
        mulberry32(seed + c * 9973 + attempt * 131),
        quotaSnap,
      );
      if (col) {
        initQuota.clear();
        for (const [id, n] of quotaSnap) initQuota.set(id, n);
        break;
      }
    }

    if (!col) {
      col =
        pickDistinctColumn(
          uniqueTiles,
          prevCol,
          mulberry32(seed + c * 0xdead + 999),
          initQuota,
        ) ?? fillColumnFallback(uniqueTiles, prevCol, mulberry32(seed + c * 0xb0ba + 77), initQuota);
    }

    for (let k = 0; k < DOME_COL_ROWS; k++) {
      out[c * DOME_COL_ROWS + k] = col[k]!;
    }
  }

  return out;
}

function buildItems(pool: ImageItem[], seg: number): ItemDef[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map(c => ({
      ...c,
      id: '',
      src: '',
      alt: '',
      title: '',
      subtitle: undefined,
      slug: undefined,
      href: undefined,
      hrefLabel: undefined,
      date: undefined,
    }));
  }

  const normalizedImages: NormalizedTile[] = pool.map((image, index) => {
    if (typeof image === 'string') {
      return {
        id: `image-${index}-${image}`,
        src: image,
        alt: '',
        title: '',
        subtitle: undefined,
        slug: undefined,
        href: undefined,
        hrefLabel: undefined,
        date: undefined,
      };
    }
    return {
      id: image.id || image.slug || image.href || image.src || `image-${index}`,
      src: image.src || '',
      alt: image.alt || '',
      title: image.title || image.alt || '',
      subtitle: image.subtitle || image.date,
      slug: image.slug,
      href: image.href,
      hrefLabel: image.hrefLabel,
      date: image.date,
    };
  });

  const identityKey = normalizedImages.map(image => image.id).sort().join('|');
  const mixSeed = domeTileMixSeed(totalSlots, normalizedImages.length, identityKey);
  const usedImages = buildColumnMajorBalancedGrid(normalizedImages, seg, mixSeed);

  return coords.map((c, i) => ({
    ...c,
    id: usedImages[i].id,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
    title: usedImages[i].title,
    subtitle: usedImages[i].subtitle,
    slug: usedImages[i].slug,
    href: usedImages[i].href,
    hrefLabel: usedImages[i].hrefLabel,
    date: usedImages[i].date,
  }));
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export default function DomeGallery({
  images = DEFAULT_IMAGES,
  fit = 0.5,
  fitBasis = 'auto',
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.25,
  heightGuardFactor = 1.35,
  overlayBlurColor = '#060010',
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  openedImageWidth,
  openedImageHeight,
  imageBorderRadius = '30px',
  openedImageBorderRadius = '30px',
  /** Grados por frame (~60 fps); 0 desactiva. */
  autoRotationSpeed = 0.02,
  tileTapExternalHref,
  tileTapAriaLabel
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const focusedElRef = useRef<HTMLElement | null>(null);
  const originalTilePositionRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const gestureStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const cancelTapRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef<number | null>(null);
  const pointerTypeRef = useRef<'mouse' | 'pen' | 'touch'>('mouse');
  const tapTargetRef = useRef<HTMLElement | null>(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);
  const externalTapGuardAt = useRef(0);

  const autoRotateRAF = useRef<number | null>(null);
  const autoRotationSpeedRef = useRef(autoRotationSpeed);
  autoRotationSpeedRef.current = autoRotationSpeed;
  const resumeAutoRotationRef = useRef<() => void>(() => {});

  const openTileExternal = useCallback(() => {
    if (!tileTapExternalHref) return;
    const now = performance.now();
    if (now - externalTapGuardAt.current < 400) return;
    externalTapGuardAt.current = now;
    openCommunityLink(tileTapExternalHref);
  }, [tileTapExternalHref]);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  };

  const resumeAutoRotation = useCallback(() => {
    if (autoRotateRAF.current != null) {
      cancelAnimationFrame(autoRotateRAF.current);
      autoRotateRAF.current = null;
    }
    if (autoRotationSpeedRef.current === 0) return;
    const tick = () => {
      const speed = autoRotationSpeedRef.current;
      if (speed === 0) {
        autoRotateRAF.current = null;
        return;
      }
      rotationRef.current.y += speed;
      applyTransform(rotationRef.current.x, rotationRef.current.y);
      autoRotateRAF.current = requestAnimationFrame(tick);
    };
    autoRotateRAF.current = requestAnimationFrame(tick);
  }, []);

  resumeAutoRotationRef.current = resumeAutoRotation;

  const lockedRadiusRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width),
        h = Math.max(1, cr.height);
      const minDim = Math.min(w, h),
        maxDim = Math.max(w, h),
        aspect = w / h;
      let basis: number;
      switch (fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = basis * fit;
      const heightGuard = h * heightGuardFactor;
      radius = Math.min(radius, heightGuard);
      radius = clamp(radius, minRadius, maxRadius);
      lockedRadiusRef.current = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty('--radius', `${lockedRadiusRef.current}px`);
      root.style.setProperty('--viewer-pad', `${viewerPad}px`);
      root.style.setProperty('--overlay-blur-color', overlayBlurColor);
      root.style.setProperty('--tile-radius', imageBorderRadius);
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [
    fit,
    fitBasis,
    minRadius,
    maxRadius,
    padFactor,
    heightGuardFactor,
    overlayBlurColor,
    imageBorderRadius,
    openedImageBorderRadius
  ]);

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y);
  }, []);

  useEffect(() => {
    resumeAutoRotation();
    return () => {
      if (autoRotateRAF.current != null) {
        cancelAnimationFrame(autoRotateRAF.current);
        autoRotateRAF.current = null;
      }
    };
  }, [autoRotationSpeed, resumeAutoRotation]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const MAX_V = 1.4;
      let vX = clamp(vx, -MAX_V, MAX_V) * 80;
      let vY = clamp(vy, -MAX_V, MAX_V) * 80;
      let frames = 0;
      const d = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);
      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;
        if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
          inertiaRAF.current = null;
          resumeAutoRotationRef.current();
          return;
        }
        if (++frames > maxFrames) {
          inertiaRAF.current = null;
          resumeAutoRotationRef.current();
          return;
        }
        const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  );

  useDrag(
    ({ event, first, last, velocity: velArr = [0, 0], direction: dirArr = [0, 0], movement }) => {
      if (focusedElRef.current) return;

      const evt = event as GestureDragEvent;
      const point = getGesturePoint(evt);
      if (!point) return;

      if (first) {
        pointerTypeRef.current = getGesturePointerType(evt);
        cancelTapRef.current = false;
        movedRef.current = false;
        draggingRef.current = false;
        gestureStartPosRef.current = point;
        startPosRef.current = null;
        const potential = (event.target as Element | null)?.closest?.('.item__image') as HTMLElement | null;
        tapTargetRef.current = potential || null;
      }

      const gestureStart = gestureStartPosRef.current ?? point;
      const rawDx = point.x - gestureStart.x;
      const rawDy = point.y - gestureStart.y;

      if (!draggingRef.current) {
        const absDx = Math.abs(rawDx);
        const absDy = Math.abs(rawDy);
        const activationDistance = pointerTypeRef.current === 'touch' ? 14 : 4;
        const dominanceRatio = pointerTypeRef.current === 'touch' ? 1.35 : 1.1;
        const horizontalIntent =
          absDx >= activationDistance && absDx > absDy * dominanceRatio;

        if (horizontalIntent) {
          if (autoRotateRAF.current) {
            cancelAnimationFrame(autoRotateRAF.current);
            autoRotateRAF.current = null;
          }
          stopInertia();
          draggingRef.current = true;
          movedRef.current = true;
          startRotRef.current = { ...rotationRef.current };
          startPosRef.current = point;
        }
      }

      if (draggingRef.current && startPosRef.current) {
        const dxTotal = point.x - startPosRef.current.x;
        const dyTotal = point.y - startPosRef.current.y;

        if (!movedRef.current) {
          const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
          if (dist2 > 16) movedRef.current = true;
        }

        const nextX = clamp(
          startRotRef.current.x - dyTotal / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg
        );
        const nextY = startRotRef.current.y + dxTotal / dragSensitivity;

        const cur = rotationRef.current;
        if (cur.x !== nextX || cur.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
        }
      }

      if (last) {
        const wasDragging = draggingRef.current;
        draggingRef.current = false;
        let isTap = false;

        if (!wasDragging && gestureStartPosRef.current) {
          const dx = point.x - gestureStartPosRef.current.x;
          const dy = point.y - gestureStartPosRef.current.y;
          const dist2 = dx * dx + dy * dy;
          const TAP_THRESH_PX = pointerTypeRef.current === 'touch' ? 10 : 6;
          if (dist2 <= TAP_THRESH_PX * TAP_THRESH_PX) {
            isTap = true;
          }
        }

        if (wasDragging) {
          const [vMagX, vMagY] = velArr;
          const [dirX, dirY] = dirArr;
          let vx = vMagX * dirX;
          let vy = vMagY * dirY;

          if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement;
            vx = (mx / dragSensitivity) * 0.02;
            vy = (my / dragSensitivity) * 0.02;
          }

          if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
            startInertia(vx, vy);
          } else {
            resumeAutoRotation();
          }
          cancelTapRef.current = true;
          lastDragEndAt.current = performance.now();
        } else {
          cancelTapRef.current = !isTap;
        }

        if (isTap && tapTargetRef.current && !focusedElRef.current) {
          if (tileTapExternalHref) openTileExternal();
          else openItemFromElement(tapTargetRef.current);
        }
        gestureStartPosRef.current = null;
        startPosRef.current = null;
        tapTargetRef.current = null;

        if (cancelTapRef.current) setTimeout(() => (cancelTapRef.current = false), 120);
        movedRef.current = false;
      }
    },
    {
      target: mainRef,
      filterTaps: true,
      pointer: { capture: false },
    }
  );

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const onCancel = () => {
      if (rootRef.current?.getAttribute('data-enlarging') === 'true') return;
      if (focusedElRef.current) return;
      const wasDragging = draggingRef.current;
      draggingRef.current = false;
      gestureStartPosRef.current = null;
      startPosRef.current = null;
      tapTargetRef.current = null;
      movedRef.current = false;
      if (!wasDragging) return;
      stopInertia();
      resumeAutoRotationRef.current();
    };
    main.addEventListener('pointercancel', onCancel);
    main.addEventListener('touchcancel', onCancel);
    return () => {
      main.removeEventListener('pointercancel', onCancel);
      main.removeEventListener('touchcancel', onCancel);
    };
  }, [stopInertia]);

  useEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;

    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current;
      if (!el) return;
      const parent = el.parentElement as HTMLElement;
      const overlay = viewerRef.current?.querySelector('.enlarge') as HTMLElement | null;
      if (!overlay) return;

      const refDiv = parent.querySelector('.item__image--reference') as HTMLElement | null;

      const targetTileRect =
        refDiv?.getBoundingClientRect() ??
        originalTilePositionRef.current;
      if (!targetTileRect) {
        overlay.remove();
        if (refDiv) refDiv.remove();
        parent.style.setProperty('--rot-y-delta', `0deg`);
        parent.style.setProperty('--rot-x-delta', `0deg`);
        el.style.visibility = '';
        el.style.zIndex = '0';
        focusedElRef.current = null;
        rootRef.current?.removeAttribute('data-enlarging');
        openingRef.current = false;
        resumeAutoRotationRef.current();
        return;
      }

      const currentRect = overlay.getBoundingClientRect();
      const rootRect = rootRef.current!.getBoundingClientRect();

      const targetTileRelativeToRoot = {
        left: targetTileRect.left - rootRect.left,
        top: targetTileRect.top - rootRect.top,
        width: targetTileRect.width,
        height: targetTileRect.height
      };

      const overlayRelativeToRoot = {
        left: currentRect.left - rootRect.left,
        top: currentRect.top - rootRect.top,
        width: currentRect.width,
        height: currentRect.height
      };

      const animatingOverlay = document.createElement('div');
      animatingOverlay.className = 'enlarge-closing';
      animatingOverlay.style.cssText = `
        position: absolute;
        left: ${overlayRelativeToRoot.left}px;
        top: ${overlayRelativeToRoot.top}px;
        width: ${overlayRelativeToRoot.width}px;
        height: ${overlayRelativeToRoot.height}px;
        z-index: 9999;
        border-radius: ${openedImageBorderRadius};
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        transition: all ${enlargeTransitionMs}ms ease-out;
        pointer-events: none;
        margin: 0;
        transform: none;
      `;

      const originalImg = overlay.querySelector('img');
      if (originalImg) {
        const img = originalImg.cloneNode() as HTMLImageElement;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        animatingOverlay.appendChild(img);
      }

      overlay.remove();
      rootRef.current!.appendChild(animatingOverlay);

      void animatingOverlay.getBoundingClientRect();

      requestAnimationFrame(() => {
        animatingOverlay.style.left = targetTileRelativeToRoot.left + 'px';
        animatingOverlay.style.top = targetTileRelativeToRoot.top + 'px';
        animatingOverlay.style.width = targetTileRelativeToRoot.width + 'px';
        animatingOverlay.style.height = targetTileRelativeToRoot.height + 'px';
        animatingOverlay.style.opacity = '0';
      });

      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        animatingOverlay.remove();
        originalTilePositionRef.current = null;

        if (refDiv) refDiv.remove();
        parent.style.transition = 'none';
        el.style.transition = 'none';

        parent.style.setProperty('--rot-y-delta', `0deg`);
        parent.style.setProperty('--rot-x-delta', `0deg`);

        requestAnimationFrame(() => {
          el.style.visibility = '';
          el.style.opacity = '0';
          el.style.zIndex = '0';
          focusedElRef.current = null;
          rootRef.current?.removeAttribute('data-enlarging');

          requestAnimationFrame(() => {
            parent.style.transition = '';
            el.style.transition = 'opacity 300ms ease-out';

            requestAnimationFrame(() => {
              el.style.opacity = '1';
              setTimeout(() => {
                el.style.transition = '';
                el.style.opacity = '';
                openingRef.current = false;
                resumeAutoRotationRef.current();
              }, 300);
            });
          });
        });
      };

      animatingOverlay.addEventListener('transitionend', cleanup, {
        once: true
      });
      setTimeout(cleanup, enlargeTransitionMs + 100);
    };

    scrim.addEventListener('click', close);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      scrim.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [enlargeTransitionMs, openedImageBorderRadius]);

  const openItemFromElement = (el: HTMLElement) => {
    if (openingRef.current) return;
    if (autoRotateRAF.current) {
        cancelAnimationFrame(autoRotateRAF.current);
        autoRotateRAF.current = null;
    }
    openingRef.current = true;
    openStartedAtRef.current = performance.now();
    const parent = el.parentElement as HTMLElement;
    focusedElRef.current = el;
    el.setAttribute('data-focused', 'true');
    const offsetX = getDataNumber(parent, 'offsetX', 0);
    const offsetY = getDataNumber(parent, 'offsetY', 0);
    const sizeX = getDataNumber(parent, 'sizeX', 2);
    const sizeY = getDataNumber(parent, 'sizeY', 2);
    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
    const parentY = normalizeAngle(parentRot.rotateY);
    const globalY = normalizeAngle(rotationRef.current.y);
    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    const rotX = -parentRot.rotateX - rotationRef.current.x;
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);
    const refDiv = document.createElement('div');
    refDiv.className = 'item__image item__image--reference opacity-0';
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
    parent.appendChild(refDiv);

    void refDiv.offsetHeight;

    const tileR = refDiv.getBoundingClientRect();
    const mainR = mainRef.current?.getBoundingClientRect();
    const frameR = frameRef.current?.getBoundingClientRect();

    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      openingRef.current = false;
      focusedElRef.current = null;
      parent.removeChild(refDiv);
      return;
    }

    originalTilePositionRef.current = {
      left: tileR.left,
      top: tileR.top,
      width: tileR.width,
      height: tileR.height
    };
    el.style.visibility = 'hidden';
    el.style.zIndex = '0';
    const overlay = document.createElement('div');
    overlay.className = 'enlarge';
    overlay.style.cssText = `position:absolute; left:${frameR.left - mainR.left}px; top:${frameR.top - mainR.top}px; width:${frameR.width}px; height:${frameR.height}px; opacity:0; z-index:30; will-change:transform,opacity; transform-origin:top left; transition:transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease; border-radius:${openedImageBorderRadius}; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.35); pointer-events: auto;`;
    const rawSrc = parent.dataset.src || (el.querySelector('img') as HTMLImageElement)?.src || '';
    const rawAlt = parent.dataset.alt || (el.querySelector('img') as HTMLImageElement)?.alt || '';
    const rawTitle = parent.dataset.title || rawAlt;
    const rawSubtitle = parent.dataset.subtitle || parent.dataset.date || '';
    const rawSlug = parent.dataset.slug || '';
    const rawHref = parent.dataset.href || '';
    const rawHrefLabel = parent.dataset.hrefLabel || 'Abrir perfil en una pestaña nueva';
    const img = document.createElement('img');
    img.src = rawSrc;
    img.alt = rawAlt || rawTitle;
    img.style.cssText =
      'width:100%; height:100%; object-fit:cover; position:relative; z-index:0;';
    overlay.appendChild(img);

    // Header (Title + optional subtitle + close button)
    const header = document.createElement('div');
    header.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        width: auto;
        box-sizing: border-box;
        padding-top: max(36px, calc(18px + env(safe-area-inset-top, 0px)));
        padding-right: max(var(--overlay-inline-pad), calc(20px + env(safe-area-inset-right, 0px)));
        padding-bottom: 28px;
        padding-left: max(var(--overlay-inline-pad), calc(20px + env(safe-area-inset-left, 0px)));
        background: linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.58) 22%, rgba(0,0,0,0.28) 52%, transparent 100%);
        opacity: 0;
        transition: opacity 0.5s ease 0.2s;
        pointer-events: none;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        z-index: 20;
    `;

    const headerLeft = document.createElement('div');
    headerLeft.style.cssText = `display:flex; flex-direction:column; gap:6px; min-width:0; flex:1;`;

    const title = document.createElement('h3');
    title.textContent = rawTitle;
    title.style.cssText = `
        font-family: 'Sora', ui-sans-serif, system-ui, sans-serif;
        color: white;
        font-size: 22px;
        margin: 0;
        font-weight: 500;
        letter-spacing: 0.01em;
        line-height: 1.2;
    `;
    headerLeft.appendChild(title);

    if (rawSubtitle) {
      const subtitleLine = document.createElement('span');
      subtitleLine.textContent = rawSubtitle;
      subtitleLine.style.cssText = `
          font-family: 'Sora', ui-sans-serif, system-ui, sans-serif;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          font-weight: 400;
          line-height: 1.35;
      `;
      headerLeft.appendChild(subtitleLine);
    }
    header.appendChild(headerLeft);

    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.style.cssText = `
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: 50%;
        background: rgba(0,0,0,0.35);
        color: white;
        border: 1px solid rgba(255,255,255,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        pointer-events: none;
        transition: background 0.2s ease;
    `;
    closeBtn.onmouseover = () => { closeBtn.style.background = 'rgba(0,0,0,0.55)'; };
    closeBtn.onmouseout = () => { closeBtn.style.background = 'rgba(0,0,0,0.35)'; };
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      scrimRef.current?.click();
    };
    header.appendChild(closeBtn);

    overlay.appendChild(header);

    // Footer (Button)
    const footer = document.createElement('div');
    footer.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        width: auto;
        box-sizing: border-box;
        padding-top: 40px;
        padding-right: max(var(--overlay-inline-pad), calc(20px + env(safe-area-inset-right, 0px)));
        padding-bottom: max(52px, calc(24px + env(safe-area-inset-bottom, 0px)));
        padding-left: max(var(--overlay-inline-pad), calc(20px + env(safe-area-inset-left, 0px)));
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        background: linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.2) 52%, transparent 100%);
        opacity: 0;
        transition: opacity 0.5s ease 0.2s;
        z-index: 20;
        pointer-events: none;
    `;

    const btn = document.createElement('button');
    btn.setAttribute('aria-label', rawHrefLabel);
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`;
    btn.style.cssText = `
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: white;
        color: #1a1918;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: transform 0.2s ease;
    `;
    btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    
    if (rawHref) {
      btn.onclick = () => {
        if (rawHref.startsWith('/')) {
          window.location.href = rawHref;
          return;
        }
        window.open(rawHref, '_blank', 'noopener,noreferrer');
      };
    } else if (rawSlug) {
      btn.onclick = () => {
        window.location.href = `/talentos/${rawSlug}`;
      };
    }
    
    footer.appendChild(btn);
    overlay.appendChild(footer);

    /** Móvil: tras abrir el overlay, el `click` sintético del toque puede llegar al botón de enlace recién montado. */
    window.setTimeout(() => {
      closeBtn.style.pointerEvents = 'auto';
      btn.style.pointerEvents = 'auto';
    }, 400);

    viewerRef.current!.appendChild(overlay);
    const tx0 = tileR.left - frameR.left;
    const ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width;
    const sy0 = tileR.height / frameR.height;

    const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
    const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;

    overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;
    setTimeout(() => {
      if (!overlay.parentElement) return;
      overlay.style.opacity = '1';
      overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
      rootRef.current?.setAttribute('data-enlarging', 'true');
      header.style.opacity = '1';
      footer.style.opacity = '1';
    }, 16);
    const autoWidth = (() => {
      const dim = Math.min(mainR.width, mainR.height);
      if (mainR.width < 640) return `${Math.round(dim * 0.94)}px`;
      return `${Math.min(480, Math.round(dim * 0.6))}px`;
    })();
    const targetWidth = openedImageWidth || autoWidth;
    const targetHeight = openedImageHeight || targetWidth;

    {
      const onFirstEnd = (ev: TransitionEvent) => {
        if (ev.propertyName !== 'transform') return;
        overlay.removeEventListener('transitionend', onFirstEnd);
        const prevTransition = overlay.style.transition;
        overlay.style.transition = 'none';
        overlay.style.width = targetWidth;
        overlay.style.height = targetHeight;
        const newRect = overlay.getBoundingClientRect();
        overlay.style.width = frameR.width + 'px';
        overlay.style.height = frameR.height + 'px';
        void overlay.offsetWidth;
        overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
        const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2;
        const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2;
        requestAnimationFrame(() => {
          overlay.style.left = `${centeredLeft}px`;
          overlay.style.top = `${centeredTop}px`;
          overlay.style.width = targetWidth;
          overlay.style.height = targetHeight;
        });
        const cleanupSecond = () => {
          overlay.removeEventListener('transitionend', cleanupSecond);
          overlay.style.transition = prevTransition;
        };
        overlay.addEventListener('transitionend', cleanupSecond, {
          once: true
        });
      };
      overlay.addEventListener('transitionend', onFirstEnd);
    }
  };

  const cssStyles = `
    .sphere-root {
      --radius: 520px;
      --viewer-pad: 72px;
      --overlay-inline-pad: clamp(24px, 6vw, 40px);
      --circ: calc(var(--radius) * 3.14);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }
    
    .sphere-root * { box-sizing: border-box; }
    .sphere, .sphere-item, .item__image { transform-style: preserve-3d; }
    
    .stage {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      position: absolute;
      inset: 0;
      margin: auto;
      perspective: calc(var(--radius) * 2);
      perspective-origin: 50% 50%;
    }
    
    .sphere {
      transform: translateZ(calc(var(--radius) * -1));
      will-change: transform;
      position: absolute;
    }
    
    .sphere-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute;
      top: -999px;
      bottom: -999px;
      left: -999px;
      right: -999px;
      margin: auto;
      transform-origin: 50% 50%;
      backface-visibility: hidden;
      transition: transform 300ms;
      transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg))) 
                 rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg))) 
                 translateZ(var(--radius));
    }
    
    .sphere-root[data-enlarging="true"] .scrim {
      opacity: 1 !important;
      pointer-events: all !important;
    }
    
    @media (max-aspect-ratio: 1/1) {
      .viewer-frame {
        height: auto !important;
        width: 100% !important;
      }
    }

    @media (min-width: 1024px) {
      .sphere-root {
        --overlay-inline-pad: clamp(20px, 2.6vw, 28px);
      }
    }
    
    .item__image {
      position: absolute;
      inset: 7px;
      border-radius: var(--tile-radius, 12px);
      overflow: hidden;
      cursor: pointer;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transition: transform 300ms;
      pointer-events: auto;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    .item__image--reference {
      position: absolute;
      inset: 7px;
      pointer-events: none;
    }
    @media (min-width: 768px) {
      .item__image, .item__image--reference {
        inset: 12px;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div
        ref={rootRef}
        className="sphere-root relative w-full h-full"
        style={
          {
            '--segments-x': segments,
            '--segments-y': segments,
            '--overlay-blur-color': overlayBlurColor,
            '--tile-radius': imageBorderRadius,
            '--enlarge-radius': openedImageBorderRadius,
          } as React.CSSProperties
        }
      >
        <main
          ref={mainRef}
          className="absolute inset-0 grid place-items-center overflow-hidden select-none bg-transparent"
          style={{
            touchAction: 'pan-y',
            WebkitUserSelect: 'none'
          }}
        >
          <div className="stage">
            <div ref={sphereRef} className="sphere">
              {items.map((it, i) => (
                <div
                  key={`${it.x},${it.y},${i},${it.id}`}
                  className="sphere-item absolute m-auto"
                  data-id={it.id}
                  data-src={it.src}
                  data-alt={it.alt}
                  data-title={it.title || it.alt}
                  data-subtitle={it.subtitle || ''}
                  data-slug={it.slug || ''}
                  data-href={it.href || ''}
                  data-href-label={it.hrefLabel || ''}
                  data-date={it.date || ''}
                  data-offset-x={it.x}
                  data-offset-y={it.y}
                  data-size-x={it.sizeX}
                  data-size-y={it.sizeY}
                  style={
                    {
                      '--offset-x': it.x,
                      '--offset-y': it.y,
                      '--item-size-x': it.sizeX,
                      '--item-size-y': it.sizeY,
                      top: '-999px',
                      bottom: '-999px',
                      left: '-999px',
                      right: '-999px',
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="item__image absolute block overflow-hidden cursor-pointer bg-gray-200 transition-transform duration-300"
                    role={tileTapExternalHref ? 'link' : 'button'}
                    tabIndex={0}
                    aria-label={
                      tileTapExternalHref
                        ? (tileTapAriaLabel ??
                          'Abrir enlace en una pestaña nueva')
                        : (it.title || it.alt || 'Abrir imagen')
                    }
                    onClick={e => {
                      if (draggingRef.current) return;
                      if (movedRef.current) return;
                      if (performance.now() - lastDragEndAt.current < 80) return;
                      if (tileTapExternalHref) {
                        e.preventDefault();
                        openTileExternal();
                        return;
                      }
                      if (openingRef.current) return;
                      openItemFromElement(e.currentTarget as HTMLElement);
                    }}
                    onKeyDown={
                      tileTapExternalHref
                        ? e => {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            e.preventDefault();
                            openTileExternal();
                          }
                        : undefined
                    }
                    style={{
                      inset: '7px',
                      borderRadius: `var(--tile-radius, ${imageBorderRadius})`,
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <img
                      src={it.src}
                      draggable={false}
                      alt={it.alt || it.title}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        backfaceVisibility: 'hidden'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute inset-0 m-auto z-[3] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(235, 235, 235, 0) 78%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)`
            }}
          />

          <div
            className="absolute left-0 right-0 top-0 h-[64px] z-[5] pointer-events-none rotate-180 sm:h-[72px]"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, transparent 28%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)`
            }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 h-[64px] z-[5] pointer-events-none sm:h-[72px]"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, transparent 28%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)`
            }}
          />

          <div
            ref={viewerRef}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
            style={{ padding: 'var(--viewer-pad)' }}
          >
            <div
              ref={scrimRef}
              className="scrim absolute z-10 pointer-events-none opacity-0 transition-opacity duration-500"
              style={{
                inset: '-25%',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.38) 30%, rgba(0,0,0,0.18) 55%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
                maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
              }}
            />
            <div
              ref={frameRef}
              className="viewer-frame h-full aspect-square flex"
              style={{
                borderRadius: `var(--enlarge-radius, ${openedImageBorderRadius})`
              }}
            />
          </div>
        </main>
      </div>
    </>
  );
}