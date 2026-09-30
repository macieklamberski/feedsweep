import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches, parsePixelSize } from '../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'vidyard'

const vidyardHosts = ['play.vidyard.com']

// Every carrier names the video with the same uuid, so one key serves them. The alphabet is what
// refuses `{uuid}.jpg` and `{uuid}.js`, which share the player's root segment.
const uuidRegex = /^[A-Za-z0-9]+$/

// The player sits at the root as `{uuid}.html`, or with no extension where `embed/v4.js` writes
// the iframe, so the single segment is what tells it from `embed/v4.js`.
const playerPathRegex = /^\/([^/]+?)(?:\.html)?$/
const scriptPathRegex = /^\/([^/]+)\.js$/

const composeEmbed = (uuid: string, thumbnail?: string): EmbedResolverResult => {
  return {
    provider,
    id: uuid,
    src: `https://play.vidyard.com/${uuid}.html`,
    // `share.vidyard.com/watch/{uuid}` redirects to the customer's own hub for a live video and
    // 404s for a deleted one, where the player page serves the same shell for any uuid at all.
    url: `https://share.vidyard.com/watch/${uuid}`,
    thumbnail: thumbnail ?? `https://play.vidyard.com/${uuid}.jpg`,
  }
}

const vidyardResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const uuid = keepIfMatches(parsed?.pathname.match(playerPathRegex)?.[1], uuidRegex)

  if (!uuid) {
    return
  }

  return composeEmbed(uuid)
}

// Vidyard's player iframe, which arrives protocol-relative and with a trailing `?`.
export const vidyardIframeEmbedResolver = createUrlEmbedResolver(vidyardHosts, vidyardResolveEmbed)

// Vidyard's v4 embed: an `<img>` that `play.vidyard.com/embed/v4.js` swaps for the player. The
// script does not survive a feed, so the still frame is left behind with no player. No title:
// Vidyard has no verdict on whether the carrier `title` names the video or labels the player.
export const vidyardImageEmbedResolver = createMarkupEmbedResolver(
  'img.vidyard-player-embed[data-uuid]',
  (element) => {
    const uuid = attr(element, 'data-uuid')

    if (!uuid) {
      return
    }

    return composeEmbed(uuid, attr(element, 'src'))
  },
)

// Vidyard's v3 embed: a per-video loader script, `play.vidyard.com/{uuid}.js`, that writes the
// player in its own place. The script does not survive a feed, so nothing renders.
export const vidyardScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="play.vidyard.com/"]',
  (element) => {
    // The selector matches a substring any host can carry, so the host is checked here.
    const parsed = parseUrlOnHosts(attr(element, 'src'), vidyardHosts)
    const uuid = parsed?.pathname.match(scriptPathRegex)?.[1]

    if (!uuid) {
      return
    }

    // The loader draws a box of exactly `width` by `height` when the query states both, and
    // scales a lone one by the video's own shape, which only Vidyard's server knows.
    const width = parsePixelSize(parsed?.searchParams.get('width'))
    const height = parsePixelSize(parsed?.searchParams.get('height'))
    const result = composeEmbed(uuid)

    return width && height ? { ...result, width, height } : result
  },
)
