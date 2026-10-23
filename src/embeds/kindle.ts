import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, encodePathSegment, placeholderBaseUrl } from '../utils/urls.js'
import {
  createMarkupEmbedResolver,
  embedCarrierSelector,
  readCarrierUrl,
} from '../utils/widgets.js'

// Each store serves the card on its own reader host, `{verb}.amazon.{store tld}`, such as
// `read.amazon.co.uk`, `lesen.amazon.de` or `ler.amazon.com.br`.
const readerHostRegex = /^[^.]+\.amazon\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/

const cardPathRegex = /^\/kp\/card\/?$/

// The Kindle preview card WordPress writes for an Amazon book, `read.amazon.com/kp/card?asin=…`.
// The cover derives from the ASIN alone on Amazon's image host.
export const kindleResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !readerHostRegex.test(parsed.hostname) || !cardPathRegex.test(parsed.pathname)) {
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

export const kindleEmbedResolver = createMarkupEmbedResolver(embedCarrierSelector, (element) => {
  return kindleResolveEmbed(readCarrierUrl(element), element)
})
