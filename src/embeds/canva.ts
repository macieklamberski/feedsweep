import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// A design id and its share token are url-safe base64, and nothing else may reach a minted path.
const safeSegmentRegex = /^[\w-]+$/

// `view` frames a design and `watch` a video design, after the id or after the id and its token.
const viewRoutes = new Set(['view', 'watch'])

// Canva's design viewer, `/design/{designId}/{shareToken}/view?embed`, with the share token as a
// path segment the older snippets leave out. Neither half addresses the design alone, so the id
// carries both. No thumbnail: its route answers a challenge page to anything but a browser.
export const canvaResolveEmbed: ResolveEmbed = (url) => {
  const [design, designId, ...rest] = getPathSegments(url)
  const route = rest.at(-1)
  const idSegments = [designId, ...rest.slice(0, -1)]

  if (design !== 'design' || !route || !viewRoutes.has(route) || idSegments.length > 2) {
    return
  }

  if (!idSegments.every((segment) => segment && safeSegmentRegex.test(segment))) {
    return
  }

  const id = idSegments.join('/')

  return {
    provider: 'canva',
    id,
    src: `https://www.canva.com/design/${id}/${route}?embed`,
    url: `https://www.canva.com/design/${id}/${route}`,
  }
}

export const canvaEmbedResolver = createUrlEmbedResolver(['canva.com'], canvaResolveEmbed)
