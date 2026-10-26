import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'art19'

const sizes = { episode: { height: 200 }, show: { height: 505 } }

const art19Hosts = ['art19.com']

// The server matches the route words and a slug show in their case only, and a uuid show and the
// episode uuid in any case.
const playerPathRegex = /^\/shows\/([^/]+)(?:\/episodes\/([^/]+))?\/embed\/?$/i

// An ART19 player, of one episode or of a whole show. The show is its slug or its uuid, and the
// episode player answers 404 without the show.
export const art19ResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const match = url.pathname.match(playerPathRegex)

  if (!match) {
    return
  }

  const [, show, episode] = match

  if (episode) {
    return {
      provider,
      id: `${show}/${episode}`,
      src: `https://art19.com/shows/${show}/episodes/${episode}/embed`,
      url: `https://art19.com/shows/${show}/episodes/${episode}`,
      ...sizes.episode,
      title: attr(element, 'title'),
    }
  }

  return {
    provider,
    id: show,
    src: `https://art19.com/shows/${show}/embed`,
    url: `https://art19.com/shows/${show}`,
    ...sizes.show,
    title: attr(element, 'title'),
  }
}

export const art19EmbedResolver = createUrlEmbedResolver(art19Hosts, art19ResolveEmbed)
