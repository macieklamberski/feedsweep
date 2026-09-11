import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { keepIfMatches, parsePixelSize } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ina'

const inaHosts = ['ina.fr']

// An id is letters and digits, and nothing else may reach a minted path.
const safeIdRegex = /^[A-Za-z0-9]+$/
// A player id is digits and a key is hex, and both are spliced into the minted query.
const safePlayerIdRegex = /^\d+$/
const safeKeyRegex = /^[0-9a-f]+$/i

// Two player generations spell the same archive id, `player.ina.fr/player/embed/{id}/…` and
// `www.ina.fr/video/embed/{id}/…`, each carried as an iframe and as a Flash object.
const playerRoutes = new Set(['player', 'video'])

// Both spell the settings the same way past the id: a player id, a key, then the box.
const playerIdSegment = 0
const keySegment = 1
const boxSegment = 2

// Both path forms redirect onto one query form that carries the same three parts, so the mint is
// the end of the chain rather than a url composed from scratch. The redirect also appends an
// autoplay flag, `1` for a path that names none and the path's own trailing value otherwise, and
// that flag is why the carrier url is not passed through: a placeholder must not start playing
// when the page loads. It moves to the render hint, for the load that follows a click.
const composePlayerUrl = (id: string, playerId: string, key: string): string => {
  return `https://player.ina.fr/embed/${id}?pid=${playerId}&key=${key}`
}

// What the id alone gives is the archive page for the same recording.
export const inaResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, inaHosts)
  const segments = parsed ? getPathSegments(parsed) : []
  const [route, embed, id, ...settings] = segments

  if (!route || !playerRoutes.has(route) || embed !== 'embed' || !id || !safeIdRegex.test(id)) {
    return
  }

  const playerId = keepIfMatches(settings[playerIdSegment], safePlayerIdRegex)
  const key = keepIfMatches(settings[keySegment], safeKeyRegex)

  return {
    provider,
    id,
    // A carrier naming no player id or no key cannot be rebuilt, so it keeps the url it came
    // with. That url still redirects into autoplay, which is the case the hint cannot reach.
    src: playerId && key ? composePlayerUrl(id, playerId, key) : url,
    url: `https://www.ina.fr/video/${id}`,
    width: parsePixelSize(settings[boxSegment]),
    height: parsePixelSize(settings[boxSegment + 1]),
  }
}

export const inaEmbedResolver = createUrlEmbedResolver(inaHosts, inaResolveEmbed)

// The parameter INA's own redirect appends to start playback.
export const inaRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
