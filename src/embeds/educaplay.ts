import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'educaplay'

const educaplayHosts = ['es.educaplay.com', 'fr.educaplay.com', 'www.educaplay.com']

// The game route in each language Educaplay serves it in.
const gameRouteWords = [
  'game', // www.educaplay.com
  'jeu', // fr.educaplay.com
  'juego', // es.educaplay.com
]

const gamePathRegex = /^\/([^/]+)\/([^/-]+)-([^/]+)\.html$/
// The retired html5 player, `/{lang}/{resources}/{id}/html5/{slug}.htm`, which answers 404.
const legacyPathRegex = /^\/[^/]+\/[^/]+\/([^/]+)\/html5\/([^/]+)\.htm$/

const gameHeight = 690

const readGame = (pathname: string): { id: string; slug: string } | undefined => {
  const game = pathname.match(gamePathRegex)

  if (game) {
    const [, routeWord = '', id = '', slug = ''] = game

    if (!gameRouteWords.includes(routeWord)) {
      return
    }

    return { id, slug }
  }

  const legacy = pathname.match(legacyPathRegex)

  if (!legacy) {
    return
  }

  const [, id = '', slug = ''] = legacy

  return { id, slug }
}

// An Educaplay game: the current player in any language, or the retired html5 player, whose id
// and slug play on the current one.
const educaplayResolveEmbed: ResolveEmbed = (url, element) => {
  const game = readGame(parseUrl(url)?.pathname ?? '')

  if (!game) {
    return
  }

  return {
    provider,
    id: game.id,
    src: `https://www.educaplay.com/game/${game.id}-${game.slug}.html`,
    url: `https://www.educaplay.com/learning-resources/${game.id}-${game.slug}.html`,
    height: gameHeight,
    title: attr(element, 'title'),
  }
}

export const educaplayEmbedResolver = createUrlEmbedResolver(educaplayHosts, educaplayResolveEmbed)
