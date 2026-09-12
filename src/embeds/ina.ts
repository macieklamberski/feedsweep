import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parsePixelSize } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const inaHosts = ['ina.fr']

// An id is letters and digits, and nothing else may reach a minted path.
const safeIdRegex = /^[A-Za-z0-9]+$/

// Two player generations spell the same archive id, `player.ina.fr/player/embed/{id}/…` and
// `www.ina.fr/video/embed/{id}/…`, each carried as an iframe and as a Flash object.
const playerRoutes = new Set(['player', 'video'])

// Both spell the settings the same way past the id: a player id, a key, then the box.
const boxSegment = 2

// The publisher's url is kept as written, since the settings past the id decide what the player
// shows. What the id alone gives is the archive page for the same recording.
export const inaResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, inaHosts)
  const segments = parsed ? getPathSegments(parsed) : []
  const [route, embed, id, ...settings] = segments

  if (!route || !playerRoutes.has(route) || embed !== 'embed' || !id || !safeIdRegex.test(id)) {
    return
  }

  return {
    provider: 'ina',
    id,
    src: url,
    url: `https://www.ina.fr/video/${id}`,
    width: parsePixelSize(settings[boxSegment]),
    height: parsePixelSize(settings[boxSegment + 1]),
  }
}

export const inaEmbedResolver = createUrlEmbedResolver(inaHosts, inaResolveEmbed)
