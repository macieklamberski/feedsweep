import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// Nothing but the id's own alphabet may reach a minted path.
const publishedIdRegex = /^[\w-]+$/

// Only the slide selects what is shown. `start`, `loop` and `delayms` run the deck for the reader.
const deckParams = ['slide']

// `/presentation/d/e/{id}/embed` frames a deck published to the web and `/pub` is its page.
export const googleslidesResolveEmbed: ResolveEmbed = (url) => {
  const segments = getPathSegments(url)
  const isPublished = segments[0] === 'presentation' && segments[1] === 'd' && segments[2] === 'e'
  const deckId = isPublished ? segments[3] : undefined

  if (!deckId || !publishedIdRegex.test(deckId)) {
    return
  }

  // The published id is its own space, separate from the Drive file id, so no thumbnail derives
  // from it.
  return {
    provider: 'googleslides',
    id: deckId,
    src: `https://docs.google.com/presentation/d/e/${deckId}/embed${pickUrlParams(url, deckParams)}`,
    url: `https://docs.google.com/presentation/d/e/${deckId}/pub`,
  }
}

export const googleslidesEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com'],
  googleslidesResolveEmbed,
)
