import { getQueryParam, isHostOf, parseUrl, startsWithAnyOf } from 'trousse'
import type { CiteResolver } from '../types.js'
import { buildCite } from '../utils/cites.js'
import { attr, find, text } from '../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { readCleanedCarrierUrl } from '../utils/widgets.js'

const provider = 'hatena'
const hosts = ['hatenablog-parts.com']

// The iframe's class is not dependable: embed-card is the common spelling, and the rest ship
// hatenablogcard, wp-embedded-content, a theme's own class, or nothing at all.
const cardClassSelector = 'iframe.embed-card, iframe.hatenablogcard'

// A host list misses this: a blog on a custom domain serves its own card from that domain.
// The self-served card is at {blog}.hatenablog.com/embed/{entry}, and the citation beside it
// names the same host.
const isSelfHosted = (source: string, citationHref: string | undefined): boolean => {
  const citation = citationHref ? parseUrl(citationHref, placeholderBaseUrl) : undefined
  const card = parseUrl(source, placeholderBaseUrl)

  if (!citation || !card) {
    return false
  }

  return isHostOf(card, citation.hostname)
}

// Hatena Blog's link card: an iframe at its card renderer, with a <cite> holding the real link.
// The iframe is the element replaced, so prose the author wrote beside it in its paragraph stays.
export const hatenaCiteResolver: CiteResolver = {
  kind: 'cite',
  selector: `${cardClassSelector}, iframe[src]`,
  extract: (element, context) => {
    const source = readCleanedCarrierUrl(element, context)

    if (!source) {
      return
    }

    const sibling = element.nextElementSibling
    const citation = sibling?.matches('cite.hatena-citation') ? sibling : undefined
    const citationLink = find(citation, 'a')
    const citationHref = attr(citationLink, 'href')
    const cardUrl = parseUrlOnHosts(source, hosts)

    // Without a card class, a frame is a card only on the renderer's own embed route.
    if (!element.matches(cardClassSelector) && !startsWithAnyOf(cardUrl?.pathname, '/embed')) {
      return
    }

    // A foreign player carrying the class would become a cite.
    if (!cardUrl && !isSelfHosted(source, citationHref)) {
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
