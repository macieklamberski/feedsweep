import { composeQuery, encodePathSegment, getQueryParam, isHostOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr, isEmptyElement } from '../utils/dom.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'puzzleme'

// The apex and `www.` 301 a `/pmm/` url onto `puzzleme.`. Other subdomains, such as `cdn3.`,
// serve their own sets under the same path, which `puzzleme.` answers with an error page.
const hosts = ['amuselabs.com', 'puzzleme.amuselabs.com', 'www.amuselabs.com']

// `/pmm/{kind}`, where the kind names the game. Any kind the server knows plays the puzzle the
// id and set name, and one it does not know answers 404.
const playerPathRegex = /^\/pmm\/([^/]+)$/i

const sizes = {
  // The loader sizes its frame to 700 pixels, and the player lays the puzzle out to fit it.
  player: { height: 700 },
}

// The player finds a puzzle by its id within the publisher's set.
const composePuzzlemeEmbed = (kind: string, id: string, set: string): EmbedResolverResult => {
  const page = `https://puzzleme.amuselabs.com/pmm/${kind}`

  return {
    provider,
    id: `${set}/${id}`,
    // `embed=1` turns the page into the embedded player, without the site's own chrome.
    src: `${page}${composeQuery({ id, set, embed: '1' })}`,
    url: `${page}${composeQuery({ id, set })}`,
    ...sizes.player,
  }
}

const puzzlemeResolveEmbed: ResolveUrlEmbed = (url) => {
  const kind = url.pathname.match(playerPathRegex)?.[1]
  const id = getQueryParam(url.searchParams, 'id')
  const set = getQueryParam(url.searchParams, 'set')

  if (!kind || !id || !set) {
    return
  }

  return composePuzzlemeEmbed(kind, id, set)
}

export const puzzlemeIframeEmbedResolver = createUrlEmbedResolver(hosts, puzzlemeResolveEmbed, {
  isOnHost: isHostOf,
})

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

    // The puzzle type comes out of its attribute decoded, and it goes into a path.
    return composePuzzlemeEmbed(encodePathSegment(kind), id, set)
  },
)
