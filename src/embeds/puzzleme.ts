import { isHostOf, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, isEmptyElement } from '../utils/dom.js'
import { composeQuery, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'puzzleme'

// The apex and `www.` 301 a `/pmm/` url onto `puzzleme.`. Other subdomains, such as `cdn3.`,
// serve their own sets under the same path, which `puzzleme.` answers with an error page.
const puzzlemeHosts = ['amuselabs.com', 'puzzleme.amuselabs.com', 'www.amuselabs.com']

// `/pmm/{kind}`, where the kind names the game. Any kind the server knows plays the puzzle the
// id and set name, and one it does not know answers 404.
const playerPathRegex = /^\/pmm\/([^/]+)$/

// The loader sizes its frame to 700 pixels, and the player lays the puzzle out to fit it.
const playerHeight = 700

// The player finds a puzzle by its id within the publisher's set.
const composePuzzlemeEmbed = (kind: string, id: string, set: string): EmbedResolverResult => {
  const page = `https://puzzleme.amuselabs.com/pmm/${kind}${composeQuery({ id, set })}`

  return {
    provider,
    id: `${set}/${id}`,
    // `embed=1` turns the page into the embedded player, without the site's own chrome.
    src: `${page}&embed=1`,
    url: page,
    height: playerHeight,
  }
}

const puzzlemeResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, puzzlemeHosts)) {
    return
  }

  const kind = parsed.pathname.match(playerPathRegex)?.[1]
  const id = parsed.searchParams.get('id')
  const set = parsed.searchParams.get('set')

  if (!kind || !id || !set) {
    return
  }

  return composePuzzlemeEmbed(kind, id, set)
}

export const puzzlemeEmbedResolver = createUrlEmbedResolver(puzzlemeHosts, puzzlemeResolveEmbed)

// The mount `puzzleme-embed.js` fills with a player frame, which renders nothing without it.
export const puzzlemeWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.pm-embed-div',
  (element) => {
    if (!isEmptyElement(element)) {
      return
    }

    const kind = attr(element, 'data-puzzletype')
    const id = attr(element, 'data-id')
    const set = attr(element, 'data-set')

    if (!kind || !id || !set) {
      return
    }

    return composePuzzlemeEmbed(kind, id, set)
  },
)
