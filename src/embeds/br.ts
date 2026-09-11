import { getPathSegments, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const brHost = 'br.de'

// The slug BR writes in front of the token is decorative: the player serves the same media
// without it and with an invented one, so the token alone names the media.
const mediaTokenRegex = /av:[0-9a-f]+$/i

const brResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const [section, route, slot] = getPathSegments(parsed)
  const token = slot?.match(mediaTokenRegex)?.[0]

  if (section !== 'mediathek' || route !== 'embed' || !token) {
    return
  }

  return {
    provider: 'br',
    id: token,
    // Every `br.de/mediathek/video/…` watch route redirects onto the ARD Mediathek landing page,
    // so there is no page the token opens.
    src: `https://www.br.de/mediathek/embed/${token}`,
  }
}

// BR's Mediathek player, framed as `br.de/mediathek/embed/{slug}av:{id}`. The podcast sibling on
// `/mediathek/podcast/embed` redirects onto the podcast index for a real episode, a fabricated
// one and no episode at all, so an episode id addresses nothing and stays unresolved.
export const brEmbedResolver = createUrlEmbedResolver([brHost], brResolveEmbed)
