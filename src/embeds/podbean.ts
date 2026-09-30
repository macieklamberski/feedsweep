import { getPathSegments, parseUrl, trimObject } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches, parsePixelSize } from '../utils/dom.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { composeQuery, isMediaFile, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'podbean'

// The `-pb` suffix is real: the v2 player appends it to its own ids.
const safeIdRegex = /^[a-z0-9]+-[a-z0-9]+(?:-pb)?$/i

const podbeanHosts = ['podbean.com']

// The v2 player renders 150 behind both url forms, and the legacy markup states 122 for a player
// Podbean retired.
const defaultPlayerHeight = 150
// The mini bar is 70 at any width. The square card fills its box, so it takes the 400 that
// Podbean's own share snippet gives it.
const miniPlayerHeight = 70
const squarePlayerHeight = 400

export const extractPodbeanId = (link: string): string | undefined => {
  const parsed = parseUrl(link, placeholderBaseUrl)

  // Podbean serves the episode audio from the same domain as the players.
  // An mp3 on the host can carry a publisher's ?i=, and the enclosure would lose its audio.
  if (!parsed || isMediaFile(parsed.pathname)) {
    return
  }

  const segments = getPathSegments(parsed)
  // `/media/player/{id}` is the legacy form, `/player-v2/?i={id}` the current one.
  // /media/player/{id} 301s to /player-v2/?i={id}-pb for a real id and 404s an invented one, while
  // the v2 player answers 200 to any id.
  const id =
    segments[0] === 'media' && segments[1] === 'player'
      ? segments[2]
      : (parsed.searchParams.get('i') ?? undefined)

  return keepIfMatches(id, safeIdRegex)
}

// The player's look the publisher picked. A reader may apply it or set its own.
const displayParams = [
  'skin',
  'btn-skin',
  'fonts',
  'font-color',
  'rtl',
  'share',
  'download',
  'logo_link',
]

// The layout picks which player loads, so it stays in the player url. Any non-zero number turns
// one on, and `mini` wins over `square`.
const layoutParams = ['square', 'mini', 'mini-only-play']

const readLayoutHeight = (query: URLSearchParams): number => {
  if (Number.parseInt(query.get('mini') ?? '', 10)) {
    return miniPlayerHeight
  }

  if (Number.parseInt(query.get('square') ?? '', 10)) {
    return squarePlayerHeight
  }

  return defaultPlayerHeight
}

export const podbeanResolveEmbed: ResolveEmbed = (url, element) => {
  const id = extractPodbeanId(url)

  if (!id) {
    return
  }

  const search = parseUrl(url, placeholderBaseUrl)?.search ?? ''
  const query = new URLSearchParams(search)
  const height = parsePixelSize(query.get('size')) ?? readLayoutHeight(query)
  const title = attr(element, 'title')

  // api.podbean.com/v1/oembed answers key-free with no title, thumbnail or author, only the
  // player's html and size.
  return {
    provider,
    id,
    src: `https://www.podbean.com/player-v2/${composeQuery({ i: id, ...pickQueryParams(search, layoutParams) })}`,
    params: pickQueryParams(search, displayParams),
    height,
    ...trimObject({ title }, Boolean),
  }
}

// The legacy podbean.com/media/player/{id} iframe, sized for a player Podbean no longer serves.
export const podbeanEmbedResolver = createUrlEmbedResolver(podbeanHosts, podbeanResolveEmbed)

// The player takes no query to start; it speaks player.js.
export const podbeanRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
