import { getPathSegments, parseUrl, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const standfmHosts = ['stand.fm']

const safeIdRegex = /^[0-9a-f]{24}$/
// stand.fm publishes two kinds today, and a first segment that names no player answers 404, which
// the page url answered anyway.
const playerKindRegex = /^[a-z]+$/

// stand.fm's own snippet sizes the iframe with a `<style>` beside it, which is stripped before the
// iframe reaches a reader. A channel embed scrolls its list of episodes inside a fixed card.
const playerHeights = toMap({ episodes: 190, channels: 390 })

// stand.fm's player iframe, or a framed page url, which answers SAMEORIGIN and shows nothing.
export const standfmResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const segments = parsed ? getPathSegments(parsed) : []
  const [kind, id] = segments[0] === 'embed' ? segments.slice(1) : segments

  if (!kind || !playerKindRegex.test(kind) || !id || !safeIdRegex.test(id)) {
    return
  }

  return {
    provider: 'standfm',
    id: `${kind}/${id}`,
    src: `https://stand.fm/embed/${kind}/${id}`,
    url: `https://stand.fm/${kind}/${id}`,
    height: playerHeights.get(kind),
  }
}

export const standfmEmbedResolver = createUrlEmbedResolver(standfmHosts, standfmResolveEmbed)
