import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'wakelet'

const wakeletHosts = ['embed.wakelet.com']

// The height Wakelet's embed dialog writes, with resizing off. The collection scrolls inside it.
const collectionHeight = 760

// `/wakes/{id}`, then an optional layout, `list` or `grid`. Wakelet answers 404 to any other
// spelling, an uppercase route word included.
const wakePathRegex = /^\/wakes\/([^/]+)(?:\/[^/]+)?$/

// The collection frame Wakelet's embed dialog writes, embed.wakelet.com/wakes/{id}/list.
// The layout and `border` are display, so every carrier is rebuilt onto the dialog's list.
const wakeletResolveEmbed: ResolveEmbed = (url) => {
  const id = parseUrlOnHosts(url, wakeletHosts)?.pathname.match(wakePathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://embed.wakelet.com/wakes/${id}/list`,
    url: `https://wakelet.com/wake/${id}`,
    height: collectionHeight,
  }
}

export const wakeletEmbedResolver = createUrlEmbedResolver(wakeletHosts, wakeletResolveEmbed)
