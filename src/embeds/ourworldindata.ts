import { isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { isFileName } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ourworldindata'

const hosts = ['ourworldindata.org']

// The site serves the route words in lowercase only, and answers 404 to `/GRAPHER/{slug}`.
const chartPathRegex = /^\/(grapher|explorers)\/([^/]+)$/i

// The embed dialog's snippet frames the page 600 pixels tall, and 696 for an explorer, whose
// controls take the extra height. The chart fills whatever box it gets.
const sizes = {
  chart: { height: 600 },
  explorer: { height: 696 },
}

// Our World in Data's chart and explorer iframes, `/grapher/{slug}` and `/explorers/{slug}`, the
// site's own page framed with its display query.
const ourworldindataResolveEmbed: ResolveUrlEmbed = (url) => {
  const match = url.pathname.match(chartPathRegex)

  if (!match) {
    return
  }

  const [, kind, slug] = match

  // The site serves `/grapher/{slug}.png` and `.svg` beside the chart page.
  if (isFileName(slug)) {
    return
  }

  const isChart = isAnyOf(kind, 'grapher')
  // An explorer and a multi-dimensional chart pick their view with params of their own, so the
  // query goes to the frame as the carrier sends it.
  const query = url.search
  const src = `https://ourworldindata.org/${kind}/${slug}${query}`

  return {
    provider,
    // The site redirects any other case of a slug to its lowercase spelling.
    id: `${kind}/${slug.toLowerCase()}`,
    src,
    url: src,
    // An explorer's image shows its default view whatever the query names.
    thumbnail: isChart ? `https://ourworldindata.org/grapher/${slug}.png${query}` : undefined,
    ...(isChart ? sizes.chart : sizes.explorer),
  }
}

export const ourworldindataEmbedResolver = createUrlEmbedResolver(hosts, ourworldindataResolveEmbed)
