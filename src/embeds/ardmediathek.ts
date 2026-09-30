import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { pickUrlParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ardmediathek'

const ardmediathekHosts = ['ardmediathek.de']

// The legacy `/{channel}/embed/{id}` route 404s.
const embedPathRegex = /^\/(?:\w+\/)?embed\/([^/]+)\/?$/

const ardmediathekResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const id = parsed?.pathname.match(embedPathRegex)?.[1]

  if (!id) {
    return
  }

  // `api.ardmediathek.de/page-gateway/pages/ard/item/{id}` answers with the title, the
  // contributing broadcaster and the image, with no key, for the id as the carrier spells it.
  return {
    provider,
    id,
    src: `https://www.ardmediathek.de/embed/${id}${pickUrlParams(url, ['startTime'])}`,
    url: `https://www.ardmediathek.de/video/${id}`,
  }
}

// The ARD Mediathek player iframe on the `/embed/{id}` route and the legacy channel route.
export const ardmediathekEmbedResolver = createUrlEmbedResolver(
  ardmediathekHosts,
  ardmediathekResolveEmbed,
)
