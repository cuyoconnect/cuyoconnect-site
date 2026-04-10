/** Igual que al tocar «Unite» en `SiteHeader` → abre `JoinCommunityModal`. */
export const OPEN_JOIN_COMMUNITY_MODAL_EVENT =
  'cuyoconnect:open-join-community-modal' as const

export function requestOpenJoinCommunityModal() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_JOIN_COMMUNITY_MODAL_EVENT))
}
