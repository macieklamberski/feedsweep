import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'wakelet'

const wakeletHosts = ['embed.wakelet.com']

// `/wakes/{id}`, then an optional layout, `list` or `grid`. Wakelet answers 404 to any other
// spelling, an uppercase route word included.
const wakePathRegex = /^\/wakes\/([^/]+)(?:\/[^/]+)?$/
const iframeSizerHeightRegex = /^\[iFrameSizer\][^:]*:(\d+):/

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
  }
}

export const wakeletEmbedResolver = createUrlEmbedResolver(wakeletHosts, wakeletResolveEmbed)

// iframe-resizer's reply, `[iFrameSizer]{frame id}:{height}:{width}:{event}`, posted as a string.
export const readWakeletHeight = (data: unknown): number | undefined => {
  if (typeof data !== 'string') {
    return
  }

  return readPixels(data.match(iframeSizerHeightRegex)?.[1])
}

// The collection sizes itself only after the parent's iframe-resizer init, here the one
// `wakelet-embed.js` posts, and answers it with the whole collection's height.
export const wakeletRenderHint: EmbedRenderHint = {
  provider,
  requestHeight:
    '[iFrameSizer]wakelet:8:false:false:32:true:true:null:bodyOffset:null:null:0:false:parent:scroll',
  readHeight: readWakeletHeight,
}
