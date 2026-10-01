import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { filterUrlQuery, isFileName } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ourworldindata'

const ourworldindataHosts = ['ourworldindata.org']

// The site serves the route words in lowercase only, and answers 404 to `/GRAPHER/{slug}`.
const chartPathRegex = /^\/(grapher|explorers)\/([^/]+)$/

// See: https://github.com/owid/owid-grapher/blob/master/packages/@ourworldindata/types/src/grapherTypes/GrapherTypes.ts.
// The grapher migrates a legacy `year` onto `time` itself.
const chartParams = ['country', 'tab', 'time', 'year']

// See: https://github.com/owid/owid-grapher/blob/master/packages/@ourworldindata/explorer/src/ExplorerConstants.ts.
// An explorer names its views by its own choice params, so only the standard display params go.
const explorerDisplayParams = [
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

// The embed dialog's snippet frames the chart page itself, 600 pixels tall, and the chart fills
// whatever box it gets.
const chartHeight = 600

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
    return isChart ? chartParams.includes(name) : !explorerDisplayParams.includes(name)
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
    height: chartHeight,
  }
}

export const ourworldindataEmbedResolver = createUrlEmbedResolver(
  ourworldindataHosts,
  ourworldindataResolveEmbed,
)
