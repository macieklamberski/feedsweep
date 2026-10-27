import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ina'

const sizes = {
  player: { ratio: '16/9' },
}

const hosts = ['ina.fr']

// Each is followed by an archive id, a player id and a key.
const playerPaths = [
  'player/embed', // player.ina.fr iframe
  'video/embed', // www.ina.fr iframe
  'video/ticket', // www.ina.fr Flash object, which answers 404
]

// The retired script loader names every part after a key, and carries the same three parts.
const scriptPathRegex =
  /^\/player\/embed\/w\/\d+\/h\/\d+\/id_notice\/([^/]+)\/id_utilisateur\/[^/]+\/hash\/[^/]+$/i

// The `embed` routes redirect onto this form with the player id and key in the query, where the
// player answers "Cette vidéo n'est plus disponible" for any item. Named by the id alone, it plays.
const composeEmbed = (id: string): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `https://player.ina.fr/embed/${id}`,
    url: `https://www.ina.fr/video/${id}`,
    ...sizes.player,
  }
}

// INA's player urls, whose iframe routes redirect into autoplay and whose Flash route is dead.
export const inaResolveEmbed: ResolveUrlEmbed = (url) => {
  const segments = getPathSegments(url)
  const [route, kind, id, playerId, key] = segments

  if (!isAnyOf(`${route}/${kind}`, playerPaths) || !id || !playerId || !key) {
    return
  }

  return composeEmbed(id)
}

export const inaIframeEmbedResolver = createUrlEmbedResolver(hosts, inaResolveEmbed)

// INA's retired script loader, a carrier the iframe fallback cannot read.
export const inaScriptEmbedResolver = createMarkupEmbedResolver(
  hosts.map((host) => `script[src*="${host}/player/embed/" i]`).join(', '),
  (element) => {
    const match = parseUrlOnHosts(attr(element, 'src'), hosts)?.pathname.match(scriptPathRegex)

    if (!match) {
      return
    }

    return composeEmbed(match[1])
  },
)

// The parameter INA's own redirect appends to start playback.
export const inaRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
