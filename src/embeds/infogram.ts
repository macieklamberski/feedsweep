import { attr } from '../utils/dom.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

// A chart id is a uuid or the short alphanumeric one the older editor issued.
const safeChartIdRegex = /^[\w-]+$/

// Infogram ships a chart as an empty div its loader fills, so stripEmptyTags deletes the div and
// the loader goes with the other scripts, losing the chart outright. A real id answers the embed
// route and a fabricated one 404s.
export const infogramEmbedResolver = createMarkupEmbedResolver(
  'div.infogram-embed[data-id]',
  (element) => {
    const chartId = attr(element, 'data-id') ?? ''

    if (!safeChartIdRegex.test(chartId)) {
      return
    }

    return {
      provider: 'infogram',
      id: chartId,
      src: `https://e.infogram.com/${chartId}?src=embed`,
      url: `https://infogram.com/${chartId}`,
      title: attr(element, 'data-title'),
    }
  },
)
