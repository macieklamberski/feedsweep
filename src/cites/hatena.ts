import { parseUrl } from 'trousse'
import type { CiteResolver } from '../types.js'
import { buildCite } from '../utils/cites.js'
import { attr, find, text } from '../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'

const cardHost = 'hatenablog-parts.com'

// The iframe's class is not dependable: embed-card is the common spelling, and the rest ship
// hatenablogcard, wp-embedded-content, a theme's own class, or nothing at all.
const cardIframeSelector = [
  'iframe.embed-card',
  'iframe.hatenablogcard',
  `iframe[src*="${cardHost}/embed"]`,
].join(', ')

const citationSelector = 'cite.hatena-citation'

// A host list misses this: a blog on a custom domain serves its own card from that domain.
// The self-served card is at {blog}.hatenablog.com/embed/{entry}, and the citation beside it
// names the same host.
const isSelfHosted = (source: string, citationHref: string | undefined): boolean => {
  const citation = citationHref ? parseUrl(citationHref, placeholderBaseUrl) : undefined

  return citation !== undefined && parseUrl(source, placeholderBaseUrl)?.host === citation.host
}

// Hatena Blog's link card: an iframe at its card renderer, with a <cite> holding the real link.
// The iframe is the element replaced, so prose the author wrote around it in the same paragraph
// stays. The <cite> that follows it is read here and removed with it, or it would be left behind
// as a stray domain link.
export const hatenaCiteResolver: CiteResolver = {
  kind: 'cite',
  selector: cardIframeSelector,
  extract: (element) => {
    const source = attr(element, 'src')

    if (!source) {
      return
    }

    const sibling = element.nextElementSibling
    const citation = sibling?.matches(citationSelector) ? sibling : undefined
    const citationLink = find(citation, 'a')
    const citationHref = attr(citationLink, 'href')
    const cardUrl = parseUrlOnHosts(source, cardHost)

    // A foreign player carrying the class would become a cite.
    if (!cardUrl && !isSelfHosted(source, citationHref)) {
      return
    }

    const result = buildCite({
      provider: 'hatena',
      // The citation's href comes first: it is the plain target, so it needs no decoding.
      url: citationHref ?? cardUrl?.searchParams.get('url'),
      title: attr(element, 'title'),
      publisher: text(citationLink),
    })

    if (result) {
      citation?.remove()
    }

    return result
  },
}
