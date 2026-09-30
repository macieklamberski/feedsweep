import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, parsePixelSize } from '../utils/dom.js'
import { digitsRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ina'

const inaHosts = ['ina.fr']

// Each is followed by an archive id, a player id and a key, and the `embed` routes then the box.
const playerPaths = [
  'player/embed', // player.ina.fr iframe
  'video/embed', // www.ina.fr iframe
  'video/ticket', // www.ina.fr Flash object, which answers 404
]

// An id is letters and digits, and nothing else may reach a minted path.
const safeIdRegex = /^[A-Za-z0-9]+$/
// A key is hex, and it and the digit player id are spliced into the minted query.
const safeKeyRegex = /^[0-9a-f]+$/i
// The retired script loader names every part after a key, and carries the same three parts.
const scriptPathRegex =
  /^\/player\/embed\/w\/(\d+)\/h\/(\d+)\/id_notice\/([A-Za-z0-9]+)\/id_utilisateur\/(\d+)\/hash\/([0-9a-fA-F]+)$/

// The `embed` routes redirect onto this form and append an autoplay flag, which would start the
// player when the page loads.
const composePlayerUrl = (id: string, playerId: string, key: string): string => {
  return `https://player.ina.fr/embed/${id}?pid=${playerId}&key=${key}`
}

const composeEmbed = (
  id: string,
  playerId: string,
  key: string,
  width: string | undefined,
  height: string | undefined,
): EmbedResolverResult => {
  return {
    provider,
    id,
    src: composePlayerUrl(id, playerId, key),
    url: `https://www.ina.fr/video/${id}`,
    width: parsePixelSize(width),
    height: parsePixelSize(height),
  }
}

// INA's player urls, whose iframe routes redirect into autoplay and whose Flash route is dead.
export const inaResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, inaHosts)
  const segments = parsed ? getPathSegments(parsed) : []
  const [route, kind, id, playerId, key, width, height] = segments

  if (!playerPaths.includes(`${route}/${kind}`) || !id || !playerId || !key) {
    return
  }

  if (!safeIdRegex.test(id) || !digitsRegex.test(playerId) || !safeKeyRegex.test(key)) {
    return
  }

  const embed = composeEmbed(id, playerId, key, width, height)

  // An iframe route plays as written, and redirects onto the player by itself. The Flash route
  // answers 404, so it gets the player.
  if (element?.localName === 'iframe' && kind === 'embed') {
    return { ...embed, src: url }
  }

  return embed
}

export const inaEmbedResolver = createUrlEmbedResolver(inaHosts, inaResolveEmbed)

// INA's retired script loader, a carrier the iframe fallback cannot read.
export const inaScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="ina.fr/player/embed/"]',
  (element) => {
    const match = parseUrlOnHosts(attr(element, 'src'), inaHosts)?.pathname.match(scriptPathRegex)

    if (!match) {
      return
    }

    const [, width, height, id, playerId, key] = match

    return composeEmbed(id, playerId, key, width, height)
  },
)

// The parameter INA's own redirect appends to start playback.
export const inaRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
