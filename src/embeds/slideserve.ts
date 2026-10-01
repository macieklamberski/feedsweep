import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'slideserve'

// Exact: `cdn6.slideserve.com` and its siblings serve the slide images.
const slideserveHosts = ['slideserve.com', 'www.slideserve.com']

const movieFileRegex = /^\/video\/([^/]+)\.swf$/
// The Flash player's `viewkey`, `presentation/{id}/{title}`.
const viewkeyRegex = /^[^/]+\/[^/]+\/(.+)/

const deckRatio = '300/271'

const parseOnHosts = (url: string | null | undefined): URL | undefined => {
  const parsed = url ? parseUrl(url, placeholderBaseUrl) : undefined

  if (parsed && isHostOf(parsed, slideserveHosts)) {
    return parsed
  }
}

// The route word is case-sensitive. The server ignores a segment after the id.
const readEmbedId = (parsed: URL): string | undefined => {
  const [route, id] = getPathSegments(parsed)

  if (route !== 'embed') {
    return
  }

  return id
}

// The retired Flash player names the deck's movie, `/video/{id}.swf`, whose id the embed page
// takes.
const readFlashId = (parsed: URL): string | undefined => {
  const [file] = getPathSegments(parsed)

  if (file !== 'player.swf') {
    return
  }

  const movie = parseOnHosts(parsed.searchParams.get('moviePath'))

  return movie?.pathname.match(movieFileRegex)?.[1]
}

// No `url` and no `thumbnail`: the deck page is `/{user}/{slug}`, and the slide images sit on a
// numbered cdn host, neither of which the id composes.
const slideserveResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseOnHosts(url)

  if (!parsed) {
    return
  }

  const id = readEmbedId(parsed) ?? readFlashId(parsed)

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.slideserve.com/embed/${id}`,
    ratio: deckRatio,
    title: flashVar(element, 'viewkey')?.match(viewkeyRegex)?.[1],
  }
}

// SlideServe's presentation iframe, `/embed/{id}`, and the Flash player it replaced.
export const slideserveEmbedResolver = createUrlEmbedResolver(
  slideserveHosts,
  slideserveResolveEmbed,
)
