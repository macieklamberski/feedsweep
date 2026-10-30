import {
  composeFragment,
  composeQuery,
  encodePathSegment,
  getFragmentParams,
  getQueryParam,
  getQueryParams,
  isAnyOf,
} from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'
import { getPathSegmentsWithoutWorkspace } from './googledrive.js'

const provider = 'googleslides'

const sizes = {
  player: { ratio: '480/299' },
}

// The page routes a deck frame names. `/export` serves the deck as a file, which stays an
// enclosure.
const deckRoutes = ['edit', 'embed', 'preview', 'pub', 'pubembed']

// `slide` is the start position. `loop` and `delayms` only shape auto-advance, which `start`
// turns on, and starting playback is the reader's call.
const deckParams = ['slide']

// A share link can write its slide in the fragment, beside flags for the toolbar and where the
// file was opened from. Only the slide the deck opens on is kept.
const deckFragmentParams = ['slide']

// `/presentation/d/e/{id}` names a deck published to the web and `/presentation/d/{id}` names it
// by its Drive file id. The legacy `/presentation/embed?id={id}` 301s onto the second.
export const googleslidesResolveEmbed: ResolveUrlEmbed = (url) => {
  const [app, route, ...deckSegments] = getPathSegmentsWithoutWorkspace(url)

  if (!isAnyOf(app, 'presentation')) {
    return
  }

  if (isAnyOf(route, 'embed')) {
    const fileId = getQueryParam(url.searchParams, 'id')

    if (!fileId) {
      return
    }

    // The file id comes out of the query decoded, and it goes into a path.
    const deckPath = encodePathSegment(fileId)

    return {
      provider,
      id: fileId,
      src: `https://docs.google.com/presentation/d/${deckPath}/embed${composeQuery(getQueryParams(url, deckParams))}${composeFragment(getFragmentParams(url, deckFragmentParams))}`,
      url: `https://docs.google.com/presentation/d/${deckPath}/pub`,
      ...sizes.player,
    }
  }

  if (!isAnyOf(route, 'd')) {
    return
  }

  const [publishedRoute] = deckSegments
  const isPublished = isAnyOf(publishedRoute, 'e')
  const [deckId, pageRoute] = isPublished ? deckSegments.slice(1) : deckSegments

  if (!deckId) {
    return
  }

  if (pageRoute !== undefined && !isAnyOf(pageRoute, deckRoutes)) {
    return
  }

  const deckPath = isPublished ? `e/${deckId}` : deckId

  // `/pub` answers `x-frame-options: SAMEORIGIN`, so the frame is always `/embed`.
  return {
    provider,
    id: deckId,
    src: `https://docs.google.com/presentation/d/${deckPath}/embed${composeQuery(getQueryParams(url, deckParams))}${composeFragment(getFragmentParams(url, deckFragmentParams))}`,
    url: `https://docs.google.com/presentation/d/${deckPath}/pub`,
    ...sizes.player,
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
