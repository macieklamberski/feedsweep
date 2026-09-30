import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, parseRatio, text } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'tenor'

// Listed exactly, not by subdomain: media.tenor.com and media1.tenor.com serve the GIF's files.
const tenorHosts = ['tenor.com', 'www.tenor.com']

const composeEmbed = (postId: string): EmbedResolverResult => {
  return {
    provider,
    id: postId,
    src: `https://tenor.com/embed/${postId}`,
    url: `https://tenor.com/view/${postId}`,
  }
}

// The frame a publisher pastes once the snippet has already run.
export const tenorResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, tenorHosts)) {
    return
  }

  const [route, postId] = getPathSegments(parsed)

  if (route !== 'embed') {
    return
  }

  if (!postId) {
    return
  }

  return composeEmbed(postId)
}

// The share snippet: an inert div holding the GIF's own link and a search link, which
// `embed.js` replaces with the frame. The script never runs here, so two text links are all
// that survives of the GIF.
export const tenorWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.tenor-gif-embed[data-postid]',
  (element) => {
    const postId = attr(element, 'data-postid')

    if (!postId) {
      return
    }

    // Tenor writes the GIF's name as the text of its own `/view/` link. The other anchor is a
    // search link, which names a query and not this GIF.
    return {
      ...composeEmbed(postId),
      // `embed.js` falls back to 1.33 when the snippet states no ratio.
      ratio: parseRatio(attr(element, 'data-aspect-ratio') ?? '1.33'),
      title: text(element, 'a[href*="tenor.com/view/"]'),
    }
  },
)

export const tenorIframeEmbedResolver = createUrlEmbedResolver(tenorHosts, tenorResolveEmbed)
