import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'art19'

const art19Hosts = ['art19.com']

// The server matches the route words and the show in their case only, and the episode uuid in
// any case.
const playerPathRegex = /^\/shows\/([^/]+)(?:\/episodes\/([^/]+))?\/embed\/?$/

// An ART19 player, of one episode or of a whole show. The show is its slug or its uuid, and the
// episode player answers 404 without the show.
export const art19ResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const match = parsed?.pathname.match(playerPathRegex)

  if (!match) {
    return
  }

  const [, show, episode] = match

  if (episode) {
    return {
      provider,
      id: `${show}/${episode.toLowerCase()}`,
      src: `https://art19.com/shows/${show}/episodes/${episode}/embed`,
      url: `https://art19.com/shows/${show}/episodes/${episode}`,
      height: 200,
      title: attr(element, 'title'),
    }
  }

  return {
    provider,
    id: show,
    src: `https://art19.com/shows/${show}/embed`,
    url: `https://art19.com/shows/${show}`,
    height: 546,
    title: attr(element, 'title'),
  }
}

export const art19EmbedResolver = createUrlEmbedResolver(art19Hosts, art19ResolveEmbed)
