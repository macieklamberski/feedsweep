import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

type FoxBrand = {
  provider: string
  playerHost: string
  pageHost: string
}

const foxnewsBrand: FoxBrand = {
  provider: 'foxnews',
  playerHost: 'video.foxnews.com',
  pageHost: 'www.foxnews.com',
}

const foxbusinessBrand: FoxBrand = {
  provider: 'foxbusiness',
  playerHost: 'video.foxbusiness.com',
  pageHost: 'www.foxbusiness.com',
}

// The two brands are separate id spaces: a Fox Business id on the Fox News player answers 404 and
// its page url lands on the video index, so the carrier's own host is what names the brand.
const foxBrands = [foxnewsBrand, foxbusinessBrand]

const playerHosts = foxBrands.map((brand) => brand.playerHost)

// The player fills whatever frames it (`html, body { width: 100%; height: 100% }` on the embed
// page), and Fox's own numbers for it are 16:9 throughout: 640 by 360 in the page's `og:video`
// and in the iframe publishers paste, 466 by 263 in the script snippet.
const playerRatio = '16/9'

// `video-embed.html` is what Fox names as the player in the video page's `twitter:player` and
// `embedUrl`. The Fox News player answers 404 for an unknown id, while the Fox Business player
// answers 200 with an empty shell and its page url redirects to the `/video` index.
const composeEmbed = (brand: FoxBrand, id: string): EmbedResolverResult => {
  return {
    provider: brand.provider,
    id,
    src: `https://${brand.playerHost}/v/video-embed.html${composeQuery({ video_id: id })}`,
    url: `https://${brand.pageHost}/video/${id}`,
    ratio: playerRatio,
  }
}

// Both carriers name the video in a query parameter: `id` on the script, `video_id` on the
// iframe, and the rest of the query is the snippet's size or the embedding page's referrer. The
// ids of the retired root `embed.js` route are gone from both the player and the page.
export const foxnewsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const brand = foxBrands.find((brand) => brand.playerHost === parsed.hostname)
  const id = parsed.searchParams.get('video_id') ?? parsed.searchParams.get('id')
  const [route, page] = getPathSegments(parsed)

  if (!brand || route !== 'v' || (page !== 'embed.js' && page !== 'video-embed.html')) {
    return
  }

  if (!id) {
    return
  }

  return composeEmbed(brand, id)
}

// Fox's old share snippet is an `embed.js` script tag whose loader is gone, so nothing plays.
export const foxnewsScriptEmbedResolver = createMarkupEmbedResolver(
  playerHosts.map((host) => `script[src*="${host}/v/embed.js"]`).join(', '),
  (element) => {
    return foxnewsResolveEmbed(attr(element, 'src') ?? '')
  },
)

export const foxnewsIframeEmbedResolver = createUrlEmbedResolver(playerHosts, foxnewsResolveEmbed)

export const foxnewsRenderHint: EmbedRenderHint = {
  provider: foxnewsBrand.provider,
  // The player reads the literal `true` and ignores every other value.
  // The player starts unmuted, and muted is a separate rule the bare `autoplay` does not carry.
  autoplayParams: { autoplay: 'true' },
}

// Both brands' embed pages load the same Fox player bundle, so the same parameter starts it.
export const foxbusinessRenderHint: EmbedRenderHint = {
  provider: foxbusinessBrand.provider,
  autoplayParams: { autoplay: 'true' },
}
