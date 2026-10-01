import { isHostOf, isPlainObject, parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'strawpoll'

// Exact: `cdn.strawpoll.com` serves the loader script and the preview images.
const strawpollHosts = ['strawpoll.com']

// The route words are case-sensitive, and so is the id.
const embedPathRegex = /^\/embed\/(?:polls\/)?([^/]+)\/?$/

const mountIdPrefix = 'strawpoll_'

const composeEmbed = (pollId: string): EmbedResolverResult => {
  return {
    provider,
    id: pollId,
    src: `https://strawpoll.com/embed/${pollId}`,
    url: `https://strawpoll.com/${pollId}`,
    thumbnail: `https://cdn.strawpoll.com/images/polls/previews/${pollId}-c.png`,
  }
}

// StrawPoll's poll frame, `/embed/{id}`, and the older `/embed/polls/{id}` it still serves.
export const strawpollResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, strawpollHosts)) {
    return
  }

  const pollId = parsed.pathname.match(embedPathRegex)?.[1]

  if (!pollId) {
    return
  }

  return composeEmbed(pollId)
}

export const strawpollIframeEmbedResolver = createUrlEmbedResolver(
  strawpollHosts,
  strawpollResolveEmbed,
)

// The wrapper div the snippet puts around the frame, `div.strawpoll-embed#strawpoll_{id}`. A feed
// that strips iframes leaves it empty, and it renders as nothing.
export const strawpollMountEmbedResolver = createMarkupEmbedResolver(
  `div.strawpoll-embed[id^="${mountIdPrefix}"]`,
  (element) => {
    const pollId = attr(element, 'id')?.slice(mountIdPrefix.length)

    if (!pollId) {
      return
    }

    // The frame resolver runs first, so a wrapper that held the frame, or a second copy of the
    // wrapper the publisher pasted, names a poll that already has its placeholder.
    const placeholders = element.ownerDocument?.querySelectorAll(
      `[data-embed-provider="${provider}"]`,
    )
    const hasPlaceholder = [...(placeholders ?? [])].some((placeholder) => {
      return placeholder.getAttribute('data-embed-id') === pollId
    })

    if (hasPlaceholder) {
      return
    }

    return composeEmbed(pollId)
  },
)

// The poll posts its rendered height unasked, as `{ type: 'strawpoll_resize', id, value }`.
export const readStrawpollHeight = (data: unknown): number | undefined => {
  if (!isPlainObject(data) || data.type !== 'strawpoll_resize') {
    return
  }

  return readPixels(data.value)
}

export const strawpollRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://strawpoll.com',
  readHeight: readStrawpollHeight,
}
