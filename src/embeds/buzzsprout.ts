import { composeQuery } from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolver,
  EmbedResolverResult,
  ResolveUrlEmbed,
} from '../types.js'
import { attr } from '../utils/dom.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'buzzsprout'

const hosts = ['buzzsprout.com']
// /{podcast}/{episode}-{slug}.js, with or without episodes/.
const episodeScriptPathRegex = /^\/(\d+)\/(?:episodes\/)?(\d+)(?:-[^/]*)?\.js$/i
// A script naming the podcast alone is the show player, which carries every episode.
const showScriptPathRegex = /^\/(\d+)\.js$/i
// /{podcast}/{episode}-{slug} with or without episodes/, the slug dot-free to keep .mp3 out.
// The episode audio is `buzzsprout.com/{podcast}/{episode}-{slug}.mp3` on the same host.
const episodePagePathRegex = /^\/(?<show>\d+)\/(?:episodes\/)?(?<episode>\d+)(?:-[^/.]*)?$/i

// Both heights are what Buzzsprout's own script writes onto the iframe it builds: 200 for the
// small episode player, 375 for the large show player (read from the served script, 2026-08-15).
const sizes = {
  episode: { height: 200 },
  show: { height: 375 },
}

// The tag filter picks which episodes the show player lists and plays.
const showPlayerParams = ['tags']

// The slug-less player url resolves, and any slug after the episode id is decorative.
const composeEmbed = (
  podcastId: string,
  episodeId?: string,
  params?: Record<string, string>,
): EmbedResolverResult => {
  const path = episodeId ? `${podcastId}/${episodeId}` : podcastId
  // The episode page and its oEmbed live under `episodes/`, and the short path only redirects.
  const pagePath = episodeId ? `${podcastId}/episodes/${episodeId}` : podcastId

  return {
    provider,
    id: path,
    src: `https://www.buzzsprout.com/${path}${composeQuery({ iframe: 'true', ...params })}`,
    url: `https://www.buzzsprout.com/${pagePath}`,
    ...(episodeId ? sizes.episode : sizes.show),
  }
}

// Buzzsprout's player iframe, whose title names the episode.
export const buzzsproutResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const page = url.pathname.match(episodePagePathRegex)?.groups

  if (!page) {
    return
  }

  const title = attr(element, 'title')
  const result = composeEmbed(page.show, page.episode)

  return title ? { ...result, title } : result
}

export const buzzsproutIframeEmbedResolver: EmbedResolver = createUrlEmbedResolver(
  hosts,
  buzzsproutResolveEmbed,
)

// Buzzsprout's WordPress shortcode: an empty div and a script naming the ids, which no reader runs.
// Feeds carrying the shortcode have no enclosure for the episode either.
export const buzzsproutScriptEmbedResolver = createMarkupEmbedResolver(
  hosts.map((host) => `script[src*="${host}" i]`).join(', '),
  (element) => {
    // The selector guarantees a src containing the host substring, so only the host and
    // path checks can reject.
    const url = parseUrlOnHosts(attr(element, 'src'), hosts)

    if (!url) {
      return
    }

    const episode = url.pathname.match(episodeScriptPathRegex)

    if (episode?.[1] && episode[2]) {
      return composeEmbed(episode[1], episode[2])
    }

    const show = url.pathname.match(showScriptPathRegex)

    if (show?.[1]) {
      return composeEmbed(show[1], undefined, pickQueryParams(url.search, showPlayerParams))
    }
  },
)

// The player takes no query to start, and Buzzsprout's help says so; it speaks player.js.
export const buzzsproutRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
