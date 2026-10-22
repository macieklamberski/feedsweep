import { parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import {
  alphanumericRegex,
  encodePathSegment,
  parseUrlOnHosts,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'vidyard'

const vidyardHosts = ['play.vidyard.com']

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
    ratio: '16/9',
  }
}

const vidyardResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  // Every carrier names the video with the same uuid, so one key serves them. The alphabet is what
  // refuses `{uuid}.jpg` and `{uuid}.js`, which share the player's root segment.
  const uuid = keepIfMatches(parsed?.pathname.match(playerPathRegex)?.[1], alphanumericRegex)

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
    // The uuid comes out of its attribute decoded, and it goes into a path.
    const uuid = encodePathSegment(attr(element, 'data-uuid') ?? '')

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

    return composeEmbed(uuid)
  },
)

export const vidyardRenderHint: EmbedRenderHint = {
  provider,
  // `1` lets the browser start the video muted, and `2` starts it only with sound.
  autoplayParams: { autoplay: '2' },
}
