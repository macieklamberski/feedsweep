import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches, parseRatio, text } from '../utils/dom.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'tenor'

const tenorHosts = ['tenor.com']

const safePostIdRegex = /^\d+$/

const composeEmbed = (postId: string): EmbedResolverResult => {
  return {
    provider,
    id: postId,
    src: `https://tenor.com/embed/${postId}`,
    url: `https://tenor.com/view/${postId}`,
  }
}

// The share snippet: an inert div holding the GIF's own link and a search link, which
// `embed.js` replaces with the frame. The script never runs here, so two text links are all
// that survives of the GIF.
export const tenorWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.tenor-gif-embed[data-postid]',
  (element) => {
    const postId = keepIfMatches(attr(element, 'data-postid'), safePostIdRegex)

    if (!postId) {
      return
    }

    // Tenor writes the GIF's name as the text of its own `/view/` link. The other anchor is a
    // search link, which names a query and not this GIF.
    return {
      ...composeEmbed(postId),
      ratio: parseRatio(attr(element, 'data-aspect-ratio') ?? ''),
      title: text(element, 'a[href*="tenor.com/view/"]'),
    }
  },
)

// The frame a publisher pastes once the snippet has already run.
export const tenorResolveEmbed: ResolveEmbed = (url) => {
  const [route, postId] = getPathSegments(url)

  if (route !== 'embed') {
    return
  }

  const id = keepIfMatches(postId, safePostIdRegex)

  return id ? composeEmbed(id) : undefined
}

export const tenorIframeEmbedResolver = createUrlEmbedResolver(tenorHosts, tenorResolveEmbed)
