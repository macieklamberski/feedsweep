import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'bookcreator'

const readerHosts = ['read.bookcreator.com']

// The reader's own routes, from its `_buildManifest.js`, and Next.js's `_next`, whose
// `/_next/image` serves files. Next.js matches each before `/[userId]/[...params]`, so a first
// segment from this list is never a user.
const readerRoutes = ['_next', 'api', 'l', 'lib', 'library', 'portfolio', 'storage']

// The box Book Creator's oEmbed writes for a portrait book, which the reader shows as a two-page
// spread. A square book gets 675 by 675. The reader fits the book inside the box.
const readerRatio = '900/675'

// Book Creator's reader frame, read.bookcreator.com/{userId}/{bookId}, as its oEmbed writes it.
// The ids are case-sensitive, and a book id under another user answers 404.
const bookcreatorResolveEmbed: ResolveEmbed = (url, element) => {
  const [userId, bookId, ...rest] = getPathSegments(url)

  if (!bookId || rest.length > 0 || readerRoutes.includes(userId)) {
    return
  }

  const id = `${userId}/${bookId}`
  // `nopreview` opens the book without the description card over it. The factory has already
  // parsed the url on the reader host, so it parses here too.
  const query = filterUrlQuery(new URL(url), (name) => name === 'nopreview')

  return {
    provider,
    id,
    src: `https://read.bookcreator.com/${id}${query}`,
    url: `https://read.bookcreator.com/${id}`,
    thumbnail: `https://assets.api.bookcreator.com/${userId}/books/${bookId}/cover/share`,
    ratio: readerRatio,
    title: attr(element, 'title'),
  }
}

export const bookcreatorEmbedResolver = createUrlEmbedResolver(readerHosts, bookcreatorResolveEmbed)
