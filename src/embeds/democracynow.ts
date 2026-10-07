import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'democracynow'

const democracynowHosts = ['democracynow.org']

const scriptLoaders = ['embed_show_v1', 'embed_show_v2']

// The path after `/embed/` names the item, and each kind has its own page.
const composeEmbed = (path: string, page: string): EmbedResolverResult => {
  return {
    provider,
    id: path,
    src: `https://www.democracynow.org/embed/${path}`,
    url: `https://www.democracynow.org/${page}`,
    ratio: '16/9',
  }
}

// Democracy Now!'s video player, `/embed/{kind}/{y}/{m}/{d}`, which plays a day's whole show or
// its headlines, or one story when a slug follows the date. The server matches the route words in
// their own case only.
export const democracynowResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, democracynowHosts)

  if (!parsed) {
    return
  }

  const [embed, kind, year, month, day, slug, ...rest] = getPathSegments(parsed)

  if (embed !== 'embed' || !day || rest.length > 0) {
    return
  }

  const date = `${year}/${month}/${day}`

  if (kind === 'story') {
    if (!slug) {
      return
    }

    return composeEmbed(`story/${date}/${slug}`, `${date}/${slug}`)
  }

  if (slug) {
    return
  }

  if (kind === 'show') {
    return composeEmbed(`show/${date}`, `shows/${date}`)
  }

  if (kind === 'headlines') {
    return composeEmbed(`headlines/${date}`, `${date}/headlines`)
  }
}

export const democracynowIframeEmbedResolver = createUrlEmbedResolver(
  democracynowHosts,
  democracynowResolveEmbed,
)

// Democracy Now!'s retired loader scripts, which answer 404: v2 `/{width}/{y}/{m}/{d}/story/{slug}`
// and v1 `/{width}/{y}/{m}/{d}/segment/{n}`. A segment has no player of its own and its number maps
// to no story offline, so the day's show stands in for it.
export const democracynowScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="democracynow.org/embed_show_v"]',
  (element) => {
    const parsed = parseUrlOnHosts(attr(element, 'src'), democracynowHosts)

    if (!parsed) {
      return
    }

    const [loader = '', , year, month, day, kind, item, ...rest] = getPathSegments(parsed)

    if (!scriptLoaders.includes(loader) || !item || rest.length > 0) {
      return
    }

    const date = `${year}/${month}/${day}`

    if (kind === 'story') {
      return composeEmbed(`story/${date}/${item}`, `${date}/${item}`)
    }

    if (kind === 'segment') {
      return composeEmbed(`show/${date}`, `shows/${date}`)
    }
  },
)
