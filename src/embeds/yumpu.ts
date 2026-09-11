import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'yumpu'

const yumpuHosts = ['yumpu.com']

const documentHashRegex = /^[A-Za-z0-9]+$/

const yumpuResolveEmbed: ResolveEmbed = (url) => {
  // The locale prefix leading the path is interchangeable: the same document answers on `/de`
  // and on `/en`.
  const [, embed, view, hash] = getPathSegments(url)
  const id = keepIfMatches(hash, documentHashRegex)

  if (embed !== 'embed' || view !== 'view' || !id) {
    return
  }

  return {
    provider,
    id,
    src: url,
  }
}

// YUMPU's flipbook iframe, which names a document by an opaque embed hash. The document page sits
// in a numeric id space that only the embed page's own canonical link joins to that hash.
export const yumpuEmbedResolver = createUrlEmbedResolver(yumpuHosts, yumpuResolveEmbed)
