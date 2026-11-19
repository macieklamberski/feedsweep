import { getQueryParam, isHostOf, parseUrl, startsWithAnyOf } from 'trousse'
import type { TransformContext, WidgetResolver } from '../types.js'
import { buildCite } from '../utils/cites.js'
import { attr, find, text } from '../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import {
  createIframe,
  matchUrl,
  readCarrierUrl,
  readPlayer,
  readRepairedCarrierUrl,
} from '../utils/widgets.js'

const provider = 'hatena'
const hosts = ['hatenablog-parts.com']

// The iframe's class is not dependable: embed-card is the common spelling, and the rest ship
// hatenablogcard, wp-embedded-content, a theme's own class, or nothing at all.
const cardClassSelector = 'iframe.embed-card, iframe.hatenablogcard'

// Hatena Blog writes a citation right after every card and player it renders, a <cite> whose
// link names the page shown.
const findCitation = (element: Element): Element | undefined => {
  const sibling = element.nextElementSibling

  if (!sibling?.matches('cite.hatena-citation')) {
    return
  }

  return sibling
}

const isOnCitedHost = (source: string, citationHref: string | undefined): boolean => {
  const citation = citationHref ? parseUrl(citationHref, placeholderBaseUrl) : undefined
  const frame = parseUrl(source, placeholderBaseUrl)

  if (!citation || !frame) {
    return false
  }

  return isHostOf(frame, citation.hostname)
}

// Hatena Blog's link card: an iframe at its card renderer, with a <cite> holding the real link.
// The iframe is the element replaced, so prose the author wrote beside it in its paragraph stays.
export const hatenaCiteResolver: WidgetResolver = {
  step: 'block',
  kind: 'cite',
  selector: `${cardClassSelector}, iframe[src]`,
  extract: (element, context) => {
    const source = matchUrl(readCarrierUrl(element), context)

    if (!source) {
      return
    }

    const citation = findCitation(element)
    const citationLink = find(citation, 'a')
    const citationHref = attr(citationLink, 'href')
    const cardUrl = parseUrlOnHosts(source, hosts)

    // Without a card class, a frame is a card only on the renderer's own embed route.
    if (!element.matches(cardClassSelector) && !startsWithAnyOf(cardUrl?.pathname, '/embed')) {
      return
    }

    // A foreign player carrying the class would become a cite. A host list misses a blog on a
    // custom domain, which serves its own card at {blog}.hatenablog.com/embed/{entry}, and the
    // citation beside it names the same host.
    if (!cardUrl && !isOnCitedHost(source, citationHref)) {
      return
    }

    const result = buildCite({
      provider,
      // The citation's href comes first: it is the plain target, so it needs no decoding.
      url: citationHref ?? getQueryParam(cardUrl?.searchParams, 'url'),
      title: attr(element, 'title'),
      publisher: text(citationLink),
    })

    // Left in place, the citation would stay behind as a stray domain link.
    if (result) {
      citation?.remove()
    }

    return result
  },
}

// The citation after a player names the player's host or its item. Left in place, it would stay
// behind under the player as a stray domain link.
export const removeHatenaPlayerCitation = async (
  carrier: Element,
  player: string | undefined,
  resolvers: ReadonlyArray<WidgetResolver>,
  context: TransformContext,
): Promise<void> => {
  const citation = findCitation(carrier)
  const citationHref = attr(find(citation, 'a'), 'href')

  if (!citation || !citationHref) {
    return
  }

  if (isOnCitedHost(readRepairedCarrierUrl(carrier, context), citationHref)) {
    citation.remove()
    return
  }

  const probe = createIframe(carrier.ownerDocument, citationHref)

  if (player && (await readPlayer(probe, resolvers, context)) === player) {
    citation.remove()
  }
}
