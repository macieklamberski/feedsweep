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

  // `read.amazon.com` loads the card of a book from any storefront, so it serves every card and no
  // one store's product page is the book's.
  return {
    provider: 'kindle',
    id: asin,
    src: `https://read.amazon.com/kp/card${composeQuery({ asin })}`,
    // The ASIN comes out of the query decoded, and it goes into a path.
    thumbnail: `https://m.media-amazon.com/images/P/${encodePathSegment(asin)}.01._SCLZZZZZZZ_.jpg`,
    height: 550,
    // The oEmbed writes the book's name here, never a player label.
    title: attr(element, 'title'),
  }
}

export const kindleEmbedResolver = createUrlEmbedResolver(kindleHosts, kindleResolveEmbed)
