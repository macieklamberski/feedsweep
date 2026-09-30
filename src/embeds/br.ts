import { decodeSegment, getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const brHost = 'br.de'

// The slug BR writes in front of the token is decorative: the token alone names the media.
const mediaTokenRegex = /av:[^/]+$/

const brResolveEmbed: ResolveEmbed = (url) => {
  const [section, route, slot] = getPathSegments(url)
  const token = decodeSegment(slot)?.match(mediaTokenRegex)?.[0]

  if (section !== 'mediathek' || route !== 'embed' || !token) {
    return
  }

  // Every `br.de/mediathek/video/…` watch route redirects onto the ARD Mediathek landing page,
  // so there is no page the token opens.
  return {
    provider: 'br',
    id: token,
    src: `https://www.br.de/mediathek/embed/${token}`,
  }
}

// BR's Mediathek player, framed as `br.de/mediathek/embed/{slug}av:{id}`. The podcast sibling on
// `/mediathek/podcast/embed` redirects onto the podcast index for a real episode, a fabricated
// one and no episode at all, so an episode id addresses nothing and stays unresolved.
export const brEmbedResolver = createUrlEmbedResolver([brHost], brResolveEmbed)
