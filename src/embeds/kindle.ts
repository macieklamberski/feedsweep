import { isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, encodePathSegment, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const kindleHosts = [
  'read.amazon.com',
  'read.amazon.com.au',
  'read.amazon.co.uk',
  'read.amazon.ca',
  'read.amazon.in',
  'lesen.amazon.de',
  'leer.amazon.es',
  'leggi.amazon.it',
  'lire.amazon.fr',
]

const cardPathRegex = /^\/kp\/card\/?$/

// The Kindle preview card WordPress writes for an Amazon book, `read.amazon.com/kp/card?asin=…`.
// The cover derives from the ASIN alone on Amazon's image host.
export const kindleResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, kindleHosts) || !cardPathRegex.test(parsed.pathname)) {
    return
  }

  const asin = parsed.searchParams.get('asin')

  if (!asin) {
    return
  }

  // The reader host picks the storefront: `read.amazon.com` answers "This book isn't available" for
  // a book sold only on another store, and each host's oEmbed answers for its own store only.
  return {
    provider: 'kindle',
    id: `${parsed.hostname}/${asin}`,
    src: `https://${parsed.hostname}/kp/card${composeQuery({ asin })}`,
    // The ASIN comes out of the query decoded, and it goes into a path.
    thumbnail: `https://m.media-amazon.com/images/P/${encodePathSegment(asin)}.01._SCLZZZZZZZ_.jpg`,
    height: 550,
    // The oEmbed writes the book's name here, never a player label.
    title: attr(element, 'title'),
  }
}

export const kindleEmbedResolver = createUrlEmbedResolver(kindleHosts, kindleResolveEmbed)
