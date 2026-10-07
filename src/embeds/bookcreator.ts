import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'bookcreator'

const readerHosts = ['read.bookcreator.com']

// The box Book Creator's oEmbed writes for a landscape book. The reader fits the book inside it.
const readerRatio = '900/675'

// Book Creator's reader frame, read.bookcreator.com/{userId}/{bookId}, as its oEmbed writes it.
// The ids are case-sensitive, and a book id under another user answers 404.
const bookcreatorResolveEmbed: ResolveEmbed = (url, element) => {
  const [userId, bookId, ...rest] = getPathSegments(url)

  if (!bookId || rest.length > 0) {
    return
  }

  const id = `${userId}/${bookId}`

  return {
    provider,
    id,
    src: `https://read.bookcreator.com/${id}`,
    url: `https://read.bookcreator.com/${id}`,
    thumbnail: `https://assets.api.bookcreator.com/${userId}/books/${bookId}/cover/share`,
    ratio: readerRatio,
    title: attr(element, 'title'),
  }
}

export const bookcreatorEmbedResolver = createUrlEmbedResolver(readerHosts, bookcreatorResolveEmbed)
