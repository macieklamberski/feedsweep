import { getQueryParam } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { encodePathSegment, hexRegex, parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'rutube'

const rutubeHosts = ['rutube.ru']

// The player reads its id off the last path segment, so `/play/embed/private/{id}` plays `{id}`.
const embedPathRegex = /^\/(?:play\/embed(?:\/private)?|video\/embed|embed)\/([^/]+)\/?$/i
const playlistPathRegex = /^\/pl\/?$/i

// `p` is the access key a private video will not play without.
const rutubeEmbedParams = ['p', 't', 'stopTime']

const composeEmbed = (videoId: string, parsed: URL): EmbedResolverResult => {
  // A playlist's `pl_video` comes out of the query decoded, and it goes into a path.
  const segment = encodePathSegment(videoId)

  // rutube.ru/api/video/{id}/ answers key-free with the title, author, duration and a poster, 200
  // for a real id and 404 for an invented one, and the poster file is named by a hash the id does
  // not yield.
  return {
    provider,
    id: videoId,
    src: `https://rutube.ru/play/embed/${segment}${pickUrlParams(parsed.href, rutubeEmbedParams)}`,
    url: getQueryParam(parsed.searchParams, 'p')
      ? undefined
      : `https://rutube.ru/video/${segment}/`,
    // The player fills its box, and Rutube's snippet and oEmbed size it 720 by 405.
    ratio: '16/9',
  }
}

export const rutubeResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, rutubeHosts)

  if (!parsed) {
    return
  }

  // An id is a uuid with the dashes stripped, and the player still plays the all-digit ids the same
  // routes carried before.
  const videoId = playlistPathRegex.test(parsed.pathname)
    ? getQueryParam(parsed.searchParams, 'pl_video')
    : keepIfMatches(parsed.pathname.match(embedPathRegex)?.[1], hexRegex)

  if (!videoId) {
    return
  }

  const result = composeEmbed(videoId, parsed)
  const title = attr(element, 'title')

  return title ? { ...result, title } : result
}

// Rutube's player iframe, rutube.ru/play/embed/{id}, and the three older spellings that 301 to it.
export const rutubeEmbedResolver = createUrlEmbedResolver(rutubeHosts, rutubeResolveEmbed)

export const rutubeRenderHint: EmbedRenderHint = {
  provider,
  // Compared as a string: only exactly true flips the player's flag.
  // A start the browser refuses it retries muted, drawing an unmute button over the video.
  autoplayParams: { autoplay: 'true' },
}
