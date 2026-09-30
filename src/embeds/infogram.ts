import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { parseUrlOnHosts, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

// The current editor issues a chart id under `_/`, older ones a slug or a uuid.
const chartIdRegex = /^(?:_\/)?[^/]+$/
// A live chart's mount id ends in `?live`, which the loader appends to the frame url as written.
const mountIdRegex = /^([^?]+)(?:\?(.*))?$/
// The loader's script id, `infogram_{width}_{chart id}`.
const scriptIdRegex = /^infogram_\d+_(.+)$/

const infogramHosts = [
  'e.infogram.com',
  'infogr.am', // The retired domain, `e.infogr.am` included
]

// Layout settings the frame page reads.
const keptParams = ['embed_type']

// Every host and spelling serves the chart on `e.infogram.com`, whose bare route redirects to
// `?src=embed`.
const composeInfogramEmbed = (
  chartId: string,
  query: string,
  title: string | undefined,
): EmbedResolverResult => {
  const params = new URLSearchParams({ src: 'embed', ...pickQueryParams(query, keptParams) })
  const live = new URLSearchParams(query).has('live') ? '&live' : ''

  return {
    provider: 'infogram',
    id: chartId,
    src: `https://e.infogram.com/${chartId}?${params}${live}`,
    url: `https://infogram.com/${chartId}`,
    title,
  }
}

// Infogram ships a chart as an empty div its loader fills, so stripEmptyTags deletes the div and
// the loader goes with the other scripts, losing the chart outright.
export const infogramWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.infogram-embed[data-id]:not(:has(iframe, [data-embed-src]))',
  (element) => {
    const match = attr(element, 'data-id')?.match(mountIdRegex)

    if (!match) {
      return
    }

    const [, chartId, query = ''] = match

    return composeInfogramEmbed(chartId, query, attr(element, 'data-title'))
  },
)

// The older snippet: a script whose id names the chart and which writes the frame beside itself
// when it runs. A reader never runs it, so the chart is lost.
export const infogramScriptEmbedResolver = createMarkupEmbedResolver(
  'script[id^="infogram_"]',
  (element) => {
    if (!parseUrlOnHosts(attr(element, 'src'), infogramHosts)) {
      return
    }

    const chartId = attr(element, 'id')?.match(scriptIdRegex)?.[1]

    if (!chartId) {
      return
    }

    return composeInfogramEmbed(chartId, '', attr(element, 'title'))
  },
)

const infogramResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const chartId = keepIfMatches(parsed?.pathname.slice(1), chartIdRegex)

  if (!parsed || !chartId) {
    return
  }

  return composeInfogramEmbed(chartId, parsed.search, undefined)
}

// The chart frame on either domain, and the retired `infogr.am/{id}` page.
export const infogramIframeEmbedResolver = createUrlEmbedResolver(
  infogramHosts,
  infogramResolveEmbed,
)
