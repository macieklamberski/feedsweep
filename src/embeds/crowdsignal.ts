import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { encodePathSegment, parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'crowdsignal'

// `/results` is the poll's own tally page, a different thing from the poll.
const pollPathRegex = /^\/(\d+)(?:\/embed)?\/?$/
const loaderPathRegex = /^\/p\/([^/]+)\.js$/
const retiredPollPathRegex = /^\/poll\/([^/]+)\/?$/
const flashPlayerPathRegex = /^\/poll\.swf$/

// A poll's height follows its answer count and the frame posts none, so this is the tallest poll
// measured, at its narrowest.
const pollHeight = 533

const composeEmbed = (pollId: string): EmbedResolverResult => {
  // The Flash flashvar `p` comes out decoded, and it goes into a path.
  const segment = encodePathSegment(pollId)

  return {
    provider,
    id: pollId,
    src: `https://poll.fm/${segment}/embed`,
    url: `https://poll.fm/${segment}`,
    height: pollHeight,
  }
}

// The poll frame, `poll.fm/{id}/embed`, and the poll page, which the snippet's <noscript> names.
export const crowdsignalResolveEmbed: ResolveEmbed = (url) => {
  const pollId = parseUrl(url, placeholderBaseUrl)?.pathname.match(pollPathRegex)?.[1]

  if (!pollId) {
    return
  }

  return composeEmbed(pollId)
}

export const crowdsignalIframeEmbedResolver = createUrlEmbedResolver(
  ['poll.fm'],
  crowdsignalResolveEmbed,
)

// The poll a snippet's <noscript> names in its frame or link, on poll.fm or the retired
// `polldaddy.com/poll/{id}` page.
const readFallbackPollId = (fallback: Element): string | undefined => {
  const named = fallback.querySelector('a[href], iframe[src]')
  const url = attr(named, 'href') ?? attr(named, 'src')
  const frame = parseUrlOnHosts(url, 'poll.fm')

  if (frame) {
    return crowdsignalResolveEmbed(frame.href)?.id
  }

  return parseUrlOnHosts(url, 'polldaddy.com')?.pathname.match(retiredPollPathRegex)?.[1]
}

// Crowdsignal's loader script, `secure.polldaddy.com/p/{id}.js` or the same path on
// `static.polldaddy.com`, writes the poll into the page client side. A <noscript> right after it
// naming the same poll as a frame or a link would show the poll a second time.
export const crowdsignalScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="polldaddy.com/p/"]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), 'polldaddy.com')
    const pollId = loader?.pathname.match(loaderPathRegex)?.[1]

    if (!pollId) {
      return
    }

    // The frame resolver runs first, so a snippet whose <noscript> held the frame already stands
    // as this poll's placeholder and the loader has nothing left to add.
    const placeholders = element.ownerDocument?.querySelectorAll(
      `[data-embed-provider="${provider}"]`,
    )
    const hasPlaceholder = [...(placeholders ?? [])].some((placeholder) => {
      return placeholder.getAttribute('data-embed-id') === pollId
    })

    if (hasPlaceholder) {
      return
    }

    const fallback = element.nextElementSibling

    if (fallback?.localName === 'noscript' && readFallbackPollId(fallback) === pollId) {
      fallback.remove()
    }

    return composeEmbed(pollId)
  },
)

const crowdsignalFlashResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !flashPlayerPathRegex.test(parsed.pathname)) {
    return
  }

  const pollId = flashVar(element, 'p')

  if (!pollId) {
    return
  }

  return composeEmbed(pollId)
}

// Polldaddy's retired Flash poll, `www.polldaddy.com/poll.swf`, naming the poll in flashvars `p`.
export const crowdsignalFlashEmbedResolver = createUrlEmbedResolver(
  ['www.polldaddy.com'],
  crowdsignalFlashResolveEmbed,
)
