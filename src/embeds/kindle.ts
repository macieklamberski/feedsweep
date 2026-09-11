import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const kindleHosts = [
  'read.amazon.com',
  'read.amazon.com.au',
  'read.amazon.co.uk',
  'read.amazon.ca',
  'read.amazon.in',
]

// An ASIN is uppercase alphanumeric, the ISBN-10 check letter included.
const safeAsinRegex = /^[0-9A-Z]+$/

const cardPathRegex = /^\/kp\/card\/?$/
const readPrefixRegex = /^read\./

// The Kindle preview card WordPress writes for an Amazon book, `read.amazon.com/kp/card?asin=…`.
// The cover derives from the ASIN alone on Amazon's image host.
export const kindleResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, kindleHosts)
  const asin =
    parsed && cardPathRegex.test(parsed.pathname) ? parsed.searchParams.get('asin') : undefined

  // The reader host is exact: a subdomain of one would mint a page on a storefront that is not there.
  if (!parsed || !kindleHosts.includes(parsed.hostname) || !asin || !safeAsinRegex.test(asin)) {
    return
  }

  // One storefront per reader host, and the product page lives on the same one.
  const storefront = parsed.hostname.replace(readPrefixRegex, '')

  return {
    provider: 'kindle',
    id: asin,
    src: `https://${parsed.hostname}/kp/card?asin=${asin}&preview=inline&linkCode=kpd`,
    url: `https://www.${storefront}/dp/${asin}`,
    thumbnail: `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`,
    // The oEmbed writes the book's name here, never a player label.
    title: attr(element, 'title'),
  }
}

export const kindleEmbedResolver = createUrlEmbedResolver(kindleHosts, kindleResolveEmbed)
