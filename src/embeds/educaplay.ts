import { isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'educaplay'

// Each language is its own subdomain, and the game route below keeps any other subdomain out.
const hosts = ['educaplay.com']

// The game route in each language Educaplay serves it in.
const gameRouteWords = [
  'game', // www.educaplay.com
  'jeu', // fr.educaplay.com
  'juego', // es.educaplay.com
]

const gamePathRegex = /^\/([^/]+)\/([^/-]+)-([^/]+)\.html$/i
// The retired html5 player, `/{lang}/{resources}/{id}/html5/{slug}.htm`, which answers 404.
const legacyPathRegex = /^\/[^/]+\/[^/]+\/([^/]+)\/html5\/([^/]+)\.htm$/i

const sizes = {
  player: { height: 690 },
}

const readGame = (pathname: string): { id: string; slug: string } | undefined => {
  const game = gamePathRegex.exec(pathname)

  if (game) {
    const [, routeWord = '', id = '', slug = ''] = game

    if (!isAnyOf(routeWord, gameRouteWords)) {
      return
    }

    return { id, slug }
  }

  const legacy = legacyPathRegex.exec(pathname)

  if (!legacy) {
    return
  }

  const [, id = '', slug = ''] = legacy

  return { id, slug }
}

// An Educaplay game: the current player in any language, or the retired html5 player, whose id
// and slug play on the current one.
const educaplayResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const game = readGame(url.pathname)

  if (!game) {
    return
  }

  return {
    provider,
    id: game.id,
    src: `https://www.educaplay.com/game/${game.id}-${game.slug}.html`,
    url: `https://www.educaplay.com/learning-resources/${game.id}-${game.slug}.html`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const educaplayEmbedResolver = createUrlEmbedResolver(hosts, educaplayResolveEmbed)
