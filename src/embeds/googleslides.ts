import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { composeQuery, encodePathSegment, pickQueryParams, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'googleslides'

// The page routes a deck frame names. `/export` serves the deck as a file, which stays an
// enclosure.
const deckRoutes = new Set(['edit', 'embed', 'preview', 'pub', 'pubembed'])

// `slide` is the start position. `loop` and `delayms` only shape auto-advance, which `start`
// turns on, and starting playback is the reader's call.
const deckParams = ['slide']

const deckRatio = '480/299'

// A share link can write its slide in the fragment, beside flags for the toolbar and where the
// file was opened from. Only the slide the deck opens on is kept.
const readDeckFragment = (parsed: URL): string => {
  const query = composeQuery(pickQueryParams(parsed.hash.slice(1), ['slide']))

  return query.replace('?', '#')
}

// `/presentation/d/e/{id}` names a deck published to the web and `/presentation/d/{id}` names it
// by its Drive file id. The legacy `/presentation/embed?id={id}` 301s onto the second.
// A Workspace prefix, `/a/{domain}/`, only picks the sign-in and serves the same deck.
export const googleslidesResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url)
  const pathSegments = getPathSegments(url)
  const segments = pathSegments[0] === 'a' ? pathSegments.slice(2) : pathSegments

  if (!parsed || segments[0] !== 'presentation') {
    return
  }

  if (segments[1] === 'embed') {
    const fileId = parsed.searchParams.get('id')

    if (!fileId) {
      return
    }

    // The file id comes out of the query decoded, and it goes into a path.
    const deckPath = encodePathSegment(fileId)

    return {
      provider,
      id: fileId,
      src: `https://docs.google.com/presentation/d/${deckPath}/embed${pickUrlParams(url, deckParams)}${readDeckFragment(parsed)}`,
      url: `https://docs.google.com/presentation/d/${deckPath}/pub`,
      ratio: deckRatio,
    }
  }

  if (segments[1] !== 'd') {
    return
  }

  const isPublished = segments[2] === 'e'
  const deckId = isPublished ? segments[3] : segments[2]

  if (!deckId) {
    return
  }

  const route = segments[isPublished ? 4 : 3]

  if (route !== undefined && !deckRoutes.has(route)) {
    return
  }

  const deckPath = isPublished ? `e/${deckId}` : deckId

  // `/pub` answers `x-frame-options: SAMEORIGIN`, so the frame is always `/embed`.
  return {
    provider,
    id: deckId,
    src: `https://docs.google.com/presentation/d/${deckPath}/embed${pickUrlParams(url, deckParams)}${readDeckFragment(parsed)}`,
    url: `https://docs.google.com/presentation/d/${deckPath}/pub`,
    ratio: deckRatio,
  }
}

export const googleslidesEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com'],
  googleslidesResolveEmbed,
)

export const googleslidesRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { start: 'true' },
}
