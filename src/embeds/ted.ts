import { encodePathSegment, getPathSegments, getQueryParam, isAnyOf, isHostOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr, flashVars, keepIfMatches, parseFlashVars } from '../utils/dom.js'
import { digitsRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ted'

const sizes = {
  player: { ratio: '16/9' },
}

const htmlSuffixRegex = /\.html$/i

const tedHosts = ['ted.com']
// Exact: `video.ted.com` and `download.ted.com` serve the talks' files under the same `/talks/`
// path, such as `video.ted.com/talks/dynamic/{file}.flv`.
const tedTalkHosts = ['embed.ted.com', 'embed-ssl.ted.com', 'www.ted.com', 'ted.com']

// `embed.ted.com/talks/{slug}.html`, and a localized variant that inserts the language:
// `embed.ted.com/talks/lang/{lang}/{slug}.html`. The slug is the talk's canonical id on
// ted.com, so a watch url follows from it without a lookup.
export const extractTedTalk = (link: URL): string | undefined => {
  if (!isHostOf(link, tedTalkHosts)) {
    return
  }

  const segments = getPathSegments(link)

  if (!isAnyOf(segments[0], 'talks')) {
    return
  }

  return (isAnyOf(segments[1], 'lang') ? segments[3] : segments[1])?.replace(htmlSuffixRegex, '')
}

// The Flash player's url is the same file for every talk, and the player is dead, so these embeds
// render nothing. The talk is only in the flashVars: as a slug in the ad targeting keys,
// `adKeys=talk={slug};year=2010;theme=…`, and as a numeric id in `ti`.
const flashPlayerPathRegex = /\/assets\/player\/swf\/embedplayer\.swf$/i
// The talk key in the flashVars adKeys value, spelled talk={slug};year={year}.
const adKeysTalkRegex = /(?:^|;)talk=([^;]+)/i

const readFlashTalk = (
  url: URL,
  element: Element | undefined,
): { slug: string; thumbnail?: string } | undefined => {
  if (!flashPlayerPathRegex.test(url.pathname)) {
    return
  }

  const config = parseFlashVars(flashVars(element))
  // Older snippets carry no adKeys and name the talk only by its number in `ti`, which the
  // embed player redirects to the talk's slug.
  const slug =
    getQueryParam(config, 'adKeys')?.match(adKeysTalkRegex)?.[1] ??
    keepIfMatches(getQueryParam(config, 'ti'), digitsRegex)

  if (!slug) {
    return
  }

  // The snippet states its own poster in `su`, on `images.ted.com`, and those files still serve
  // with no signature and no expiry.
  const poster = getQueryParam(config, 'su')

  // The slug comes out of the flashvars decoded, and it goes into a path beside the raw spelling.
  return {
    slug: encodePathSegment(slug),
    thumbnail: parseUrlOnHosts(poster, tedHosts) ? poster : undefined,
  }
}

// TED's embed.ted.com iframe, and the dead Flash player that names the talk only in its flashVars.
export const tedResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const slug = extractTedTalk(url)
  const talk = slug ? { slug } : readFlashTalk(url, element)

  if (!talk) {
    return
  }

  const title = attr(element, 'title')

  // The thumbnail is not derivable from the slug: TED's oEmbed returns `thumbnail_url`, so an
  // iframe carrier leaves it to enrichment. Only the Flash carrier states one, in its own config.
  return {
    provider,
    id: talk.slug,
    // Feeds carry a short slug (`ethan_zuckerman`) and TED redirects it to the full one, which
    // cannot be derived offline.
    src: `https://embed.ted.com/embed/${talk.slug}`,
    url: `https://www.ted.com/talks/${talk.slug}`,
    thumbnail: talk.thumbnail,
    ...sizes.player,
    title,
  }
}

export const tedEmbedResolver = createUrlEmbedResolver(tedHosts, tedResolveEmbed)

// Starts playback on the click that loads the player: the embed reads `autoplay` out of its route
// query, and its 308 from a short talk slug to the full one keeps the query.
export const tedRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
