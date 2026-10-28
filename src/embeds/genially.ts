import { getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { hexRegex } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'genially'

// The view id is a dashless 24-character hex id. On the main site the length tells it from a page
// such as `genially.com/de`, whose name is hex too.
const safeViewIdRegex = /^[0-9a-f]{24}$/i

const hosts = ['genially.com', 'genial.ly']

const sizes = {
  player: { ratio: '16/9' },
}

export const extractGeniallyViewId = (link: URL): string | undefined => {
  const [route, page, indexedId] = getPathSegments(link)

  // The retired `View/Index/{id}` route.
  if (isAnyOf(route, 'view') && isAnyOf(page, 'index')) {
    return keepIfMatches(indexedId, hexRegex)
  }

  // The view host serves views alone, and answers 404 for a site page such as `/de`.
  if (parseUrl(link)?.hostname.startsWith('view.')) {
    return keepIfMatches(route, hexRegex)
  }

  const viewId = isAnyOf(route, 'view') ? page : route

  return keepIfMatches(viewId, safeViewIdRegex)
}

// Genially's presentation iframe, on the retired `view.genial.ly` host as often as the current one,
// and on the retired `www.genial.ly/View/Index/{id}` route.
export const geniallyResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const viewId = extractGeniallyViewId(url)

  if (!viewId) {
    return
  }

  const title = attr(element, 'title')

  // No thumbnail offline: the page's `og:image` on `thumbnails.genially.com` is keyed by ids that
  // appear nowhere in the embed url.
  return {
    provider,
    id: viewId,
    // `view.genial.ly/{id}` answers 301 to `view.genially.com/{id}`, where a real id answers 200
    // and an invented one 302s away.
    src: `https://view.genially.com/${viewId}`,
    ...sizes.player,
    title,
  }
}

export const geniallyIframeEmbedResolver = createUrlEmbedResolver(hosts, geniallyResolveEmbed)

// Genially's script embed: a `div.genially-embed` whose id is the view id, which `embed.js` fills
// with the view's frame.
export const geniallyWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.genially-embed[id]',
  (element) => {
    const viewId = keepIfMatches(attr(element, 'id'), hexRegex)

    if (!viewId) {
      return
    }

    return {
      provider,
      id: viewId,
      src: `https://view.genially.com/${viewId}`,
      ...sizes.player,
    }
  },
)
