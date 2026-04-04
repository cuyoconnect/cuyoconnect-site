export const COMMUNITY_LINKS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: 'https://chat.whatsapp.com/IpH9WoZHXvFKGJ0wzj5dQp',
  },
  {
    id: 'whatsapp-channel',
    label: 'Canal de anuncios',
    href: 'https://whatsapp.com/channel/0029VbBN9NCAInPkxrmiSP0l',
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

/** Abre el enlace en una pestaña nueva (comportamiento de navegador, no popup). */
export function openCommunityLink(href: string) {
  window.open(href, '_blank', 'noopener,noreferrer')
}
