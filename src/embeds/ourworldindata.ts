import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { filterUrlQuery, isFileName } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ourworldindata'

const ourworldindataHosts = ['ourworldindata.org']

// The site serves the route words in lowercase only, and answers 404 to `/GRAPHER/{slug}`.
const chartPathRegex = /^\/(grapher|explorers)\/([^/]+)$/

// See: https://github.com/owid/owid-grapher/blob/master/packages/@ourworldindata/explorer/src/ExplorerConstants.ts.
// An explorer and a multi-dimensional chart pick their view with params of their own, so only the
// standard display params go.
const displayParams = [
  'endpointsOnly',
  'facet',
  'focus',
  'globe',
  'globeRotation',
  'globeZoom',
  'hideControls',
  'mapSelect',
  'overlay',
  'peerCountries',
  'pickerMetric',
  'pickerSort',
  'region',
  'showNoDataArea',
  'showSelectionOnlyInTable',
  'stackMode',
  'tableFilter',
  'tableSearch',
  'uniformYAxis',
  'xScale',
  'yScale',
  'zoomToSelection',
]
const trackingParamRegex = /^(?:utm_|fbclid$)/

// The embed dialog's snippet frames the page 600 pixels tall, and 696 for an explorer, whose
// controls take the extra height. The chart fills whatever box it gets.
const chartHeight = 600
const explorerHeight = 696

const ourworldindataResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url)
  const match = parsed?.pathname.match(chartPathRegex)

  if (!parsed || !match) {
    return
  }

  const [, kind, slug] = match

  // The site serves `/grapher/{slug}.png` and `.svg` beside the chart page.
  if (isFileName(slug)) {
    return
  }

  const isChart = kind === 'grapher'
  const query = filterUrlQuery(parsed, (name) => {
    return !displayParams.includes(name) && !trackingParamRegex.test(name)
  })
  const src = `https://ourworldindata.org/${kind}/${slug}${query}`

  return {
    provider,
    // The site redirects any other case of a slug to its lowercase spelling.
    id: `${kind}/${slug.toLowerCase()}`,
    src,
    url: src,
    // An explorer's image shows its default view whatever the query names.
    thumbnail: isChart ? `https://ourworldindata.org/grapher/${slug}.png${query}` : undefined,
    height: isChart ? chartHeight : explorerHeight,
  }
}

export const ourworldindataEmbedResolver = createUrlEmbedResolver(
  ourworldindataHosts,
  ourworldindataResolveEmbed,
)
