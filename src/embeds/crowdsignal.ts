import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'crowdsignal'

const safePollIdRegex = /^\d+$/

// The loader path is `/p/{id}.js` on the retired Polldaddy host.
const loaderPathRegex = /^\/p\/(\d+)\.js$/

const composeEmbed = (pollId: string): EmbedResolverResult => {
  return {
    provider,
    id: pollId,
    src: `https://poll.fm/${pollId}/embed`,
    url: `https://poll.fm/${pollId}`,
  }
}

// The poll frame, `poll.fm/{id}/embed`, and the poll page, which the snippet's <noscript> names.
// A real id answers the frame and a fabricated one redirects to a missing-poll page.
export const crowdsignalResolveEmbed: ResolveEmbed = (url) => {
  const [pollId, route, ...rest] = getPathSegments(url)

  if (!pollId || !safePollIdRegex.test(pollId) || rest.length) {
    return
  }

  // `/results` is the poll's own tally page, a different thing from the poll.
  if (route && route !== 'embed') {
    return
  }

  return composeEmbed(pollId)
}

export const crowdsignalIframeEmbedResolver = createUrlEmbedResolver(
  ['poll.fm'],
  crowdsignalResolveEmbed,
)

// Crowdsignal's loader script, `secure.polldaddy.com/p/{id}.js`, writes the poll into the page
// client side. Its <noscript> names the same poll as a frame or a link, either of which would
// show the poll a second time.
export const crowdsignalScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="polldaddy.com/p/"]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), 'polldaddy.com')
    const pollId = loader?.pathname.match(loaderPathRegex)?.[1]

    if (!pollId) {
      return
    }

    // The frame resolver runs first, so a snippet whose <noscript> held the frame already stands
    // as this poll's placeholder and the loader has nothing left to add. The id is digits.
    if (element.ownerDocument?.querySelector(`[data-embed-id="${pollId}"]`)) {
      return
    }

    // Siblings only: the snippet keeps its fallback link beside the loader, and reaching past
    // them would take a link to the poll that an author wrote in the body.
    for (const sibling of Array.from(element.parentElement?.children ?? [])) {
      if (sibling !== element && sibling.outerHTML.includes(`poll.fm/${pollId}`)) {
        sibling.remove()
      }
    }

    return composeEmbed(pollId)
  },
)
