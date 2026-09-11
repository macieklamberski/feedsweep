import { isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const kindleHosts = [
  'read.amazon.com',
  'read.amazon.com.au',
  'read.amazon.co.uk',
  'read.amazon.ca',
  'read.amazon.in',
]

// `read.amazon.com.au` also serves cards for books sold only on `amazon.co.jp`.
const sharedStoreHosts = ['read.amazon.com.au']

// `preview=newtab` opens the sample in a new tab. The card's script sets `tag` and `linkCode` on
// every store link it opens when a tag is present.
const cardParams = ['preview', 'tag', 'linkCode']

// An ASIN is uppercase alphanumeric, the ISBN-10 check letter included.
const safeAsinRegex = /^[0-9A-Z]+$/
const cardPathRegex = /^\/kp\/card\/?$/

// The Kindle preview card WordPress writes for an Amazon book, `read.amazon.com/kp/card?asin=…`.
// The cover derives from the ASIN alone on Amazon's image host.
export const kindleResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  // The reader host is exact: a subdomain of one would mint a page on a storefront that is not there.
  if (!parsed || !isHostOf(parsed, kindleHosts) || !cardPathRegex.test(parsed.pathname)) {
    return
  }

  const asin = parsed.searchParams.get('asin')

  if (!asin || !safeAsinRegex.test(asin)) {
    return
  }

  const query = composeQuery({
    asin,
    preview: 'inline',
    linkCode: 'kpd',
    ...pickQueryParams(parsed.search, cardParams),
  })
  const storefront = parsed.hostname.slice('read.'.length)
  const isSharedStore = sharedStoreHosts.includes(parsed.hostname)

  return {
    provider: 'kindle',
    id: asin,
    src: `https://${parsed.hostname}/kp/card${query}`,
    url: isSharedStore ? undefined : `https://www.${storefront}/dp/${asin}`,
    thumbnail: `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`,
    // The oEmbed writes the book's name here, never a player label.
    title: attr(element, 'title'),
  }
}

export const kindleEmbedResolver = createUrlEmbedResolver(kindleHosts, kindleResolveEmbed)
