import { getPathSegments, isAnyOf, toMap } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { hexRegex, lettersRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'standfm'

const standfmHosts = ['stand.fm']

// stand.fm's own snippet sizes the iframe with a `<style>` beside it, which is stripped before the
// iframe reaches a reader. A channel embed scrolls its list of episodes inside a fixed card.
const playerHeights = toMap({ episodes: 190, channels: 390 })

// stand.fm's player iframe, or a framed page url, which answers SAMEORIGIN and shows nothing.
export const standfmResolveEmbed: ResolveUrlEmbed = (url) => {
  const segments = getPathSegments(url)
  const [kind, id] = isAnyOf(segments[0], 'embed') ? segments.slice(1) : segments

  // The hex alphabet keeps a route word such as `/episodes/new`, a live page, out of the id slot.
  if (!kind || !lettersRegex.test(kind) || !id || !hexRegex.test(id)) {
    return
  }

  return {
    provider,
    id: `${kind}/${id}`,
    src: `https://stand.fm/embed/${kind}/${id}`,
    url: `https://stand.fm/${kind}/${id}`,
    height: playerHeights.get(kind.toLowerCase()),
  }
}

export const standfmEmbedResolver = createUrlEmbedResolver(standfmHosts, standfmResolveEmbed)
