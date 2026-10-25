import { encodePathSegment, getQueryParam } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { readIframeResizeHeight } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'infogram'

// The current editor issues a chart id under `_/`, older ones a slug or a uuid.
const chartIdRegex = /^(?:_\/)?[^/]+$/
// A live chart's mount id ends in `?live`, which the loader appends to the frame url as written.
const mountIdRegex = /^([^?]+)(?:\?(.*))?$/
// The loader's script id, `infogram_{width}_{chart id}`.
const scriptIdRegex = /^infogram_\d+_(.+)$/i

const infogramHosts = [
  'e.infogram.com',
  'infogr.am', // The retired domain, `e.infogr.am` included
]

// Every host and spelling serves the chart on `e.infogram.com`, whose bare route redirects to
// `?src=embed`. The path is the chart id as a url spells it.
const composeInfogramEmbed = (
  chartId: string,
  path: string,
  query: string,
  title: string | undefined,
): EmbedResolverResult => {
  const live = getQueryParam(new URLSearchParams(query), 'live') !== undefined ? '&live' : ''

  return {
    provider,
    id: chartId,
    src: `https://e.infogram.com/${path}?src=embed${live}`,
    url: `https://infogram.com/${path}`,
    title,
  }
}

// An attribute's chart id comes out decoded. The `_/` in front of a current id is a segment of
// its own, and the rest goes into the path as one.
const encodeChartId = (chartId: string): string => {
  const prefix = chartId.startsWith('_/') ? '_/' : ''

  return `${prefix}${encodePathSegment(chartId.slice(prefix.length))}`
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

    return composeInfogramEmbed(chartId, encodeChartId(chartId), query, attr(element, 'data-title'))
  },
)

// The older snippet: a script whose id names the chart and which writes the frame beside itself
// when it runs. A reader never runs it, so the chart is lost.
export const infogramScriptEmbedResolver = createMarkupEmbedResolver(
  'script[id^="infogram_" i]',
  (element) => {
    if (!parseUrlOnHosts(attr(element, 'src'), infogramHosts)) {
      return
    }

    const chartId = attr(element, 'id')?.match(scriptIdRegex)?.[1]

    if (!chartId) {
      return
    }

    return composeInfogramEmbed(chartId, encodeChartId(chartId), '', attr(element, 'title'))
  },
)

const infogramResolveEmbed: ResolveUrlEmbed = (_url, element, parsed) => {
  const chartId = keepIfMatches(parsed.pathname.slice(1), chartIdRegex)

  if (!chartId) {
    return
  }

  return composeInfogramEmbed(chartId, chartId, parsed.search, attr(element, 'title'))
}

// The chart frame on either domain, and the retired `infogr.am/{id}` page.
export const infogramIframeEmbedResolver = createUrlEmbedResolver(
  infogramHosts,
  infogramResolveEmbed,
)

// The chart posts its rendered height unasked, again whenever its width changes it.
export const infogramRenderHint: EmbedRenderHint = {
  provider,
  readHeight: readIframeResizeHeight,
}
