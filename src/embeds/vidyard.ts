import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'vidyard'

const vidyardHosts = ['play.vidyard.com']

// Both carriers name the video with the same uuid, so one key serves them.
const uuidRegex = /^[A-Za-z0-9]+$/

// The player sits at the root, `{uuid}.html`, beside `{uuid}.jpg` and `embed/v4.js`, so the
// extension and the single segment are what tell the player page from the rest of the host.
const playerPathRegex = /^\/([^/]+)\.html$/

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
    const uuid = keepIfMatches(attr(element, 'data-uuid'), uuidRegex)

    if (!uuid) {
      return
    }

    return composeEmbed(uuid, attr(element, 'src'))
  },
)
