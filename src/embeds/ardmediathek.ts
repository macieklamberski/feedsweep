import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ardmediathek'

const ardmediathekHosts = ['ardmediathek.de']

// `isOnHosts` admits a subdomain, so the image services on `api.ardmediathek.de` and
// `img.ardmediathek.de` reach the resolver, and this route is what refuses them.
const embedPathRegex = /^\/embed\/([^/]+)\/?$/
// The base64 alphabets, standard and url-safe, which is how every id is spelled.
const safeIdRegex = /^[\w+=-]+$/

const ardmediathekResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const id = keepIfMatches(parsed?.pathname.match(embedPathRegex)?.[1], safeIdRegex)

  if (!id) {
    return
  }

  // `api.ardmediathek.de/page-gateway/pages/ard/item/{id}` answers with the title, the
  // contributing broadcaster and the image, with no key, for the id as the carrier spells it.
  return {
    provider,
    id,
    src: `https://www.ardmediathek.de/embed/${id}`,
    url: `https://www.ardmediathek.de/video/${id}`,
  }
}

// The ARD Mediathek player iframe, the one shape the share dialog writes.
export const ardmediathekEmbedResolver = createUrlEmbedResolver(
  ardmediathekHosts,
  ardmediathekResolveEmbed,
)
