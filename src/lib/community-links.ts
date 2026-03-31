export const COMMUNITY_LINKS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: 'https://chat.whatsapp.com/IpH9WoZHXvFKGJ0wzj5dQp',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/cuyoconnect/',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/cuyoconnect/',
  },
  {
    id: 'x',
    label: 'X',
    href: 'https://x.com/CuyoConnect',
  },
  {
    id: 'discord',
    label: 'Discord',
    href: 'https://discord.gg/jZRKTNbNqU',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    href: 'https://t.me/+dYDu2fqGC3Y1ZDVh',
  },
  {
    id: 'luma',
    label: 'Calendario en Luma',
    href: 'https://luma.com/calendar/cal-GDIEkhScyp1dPKU',
  },
] as const

export type CommunityLinkId = (typeof COMMUNITY_LINKS)[number]['id']

export const LUMA_CALENDAR_EMBED_SRC =
  'https://luma.com/embed/calendar/cal-GDIEkhScyp1dPKU/events?theme=light'

export function openCommunityLink(href: string) {
  const w = 640
  const h = 720
  const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0
  const dualScreenTop = window.screenTop ?? window.screenY ?? 0
  const vw =
    window.innerWidth ??
    document.documentElement.clientWidth ??
    window.screen.width
  const vh =
    window.innerHeight ??
    document.documentElement.clientHeight ??
    window.screen.height
  const left = vw / 2 - w / 2 + dualScreenLeft
  const top = vh / 2 - h / 2 + dualScreenTop
  const features = [
    'popup=yes',
    `width=${w}`,
    `height=${h}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
    'scrollbars=yes',
    'resizable=yes',
  ].join(',')

  const win = window.open(href, 'cuyoconnect_community', features)
  if (win) win.opener = null
}
