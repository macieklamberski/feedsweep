import type { DomTransform } from '../../types.js'
import { attr, getElementDimensions, parsePixelSize } from '../../utils/dom.js'
import { parseUrlOnHosts } from '../../utils/urls.js'
import { createLinkedImage } from '../../utils/widgets.js'

const hosts = ['tradingeconomics.com', 'd3fy651gv2fhd3.cloudfront.net']
const embedPathRegex = /^\/embed\/?$/i

// A Trading Economics chart iframe, whose page holds nothing but one static PNG of the chart.
// The page serves that PNG at /charts/embed.png with the iframe's own query, on either host.
export const convertTradingEconomicsEmbeds: DomTransform = () => (document) => {
  for (const iframe of document.querySelectorAll('iframe')) {
    const url = parseUrlOnHosts(attr(iframe, 'src'), hosts)

    if (!url || !embedPathRegex.test(url.pathname) || !url.searchParams.get('s')) {
      continue
    }

    const ref = url.searchParams.get('ref')
    const dimensions = getElementDimensions(iframe)

    // The frame links tradingeconomics.com followed by `ref`, the path of the indicator's page.
    const href = ref?.startsWith('/')
      ? `https://tradingeconomics.com${ref}`
      : 'https://tradingeconomics.com/'

    const image = createLinkedImage(document, {
      src: `${url.origin}/charts/embed.png${url.search}`,
      href,
      width: dimensions.width ?? parsePixelSize(url.searchParams.get('w')),
      height: dimensions.height ?? parsePixelSize(url.searchParams.get('h')),
    })

    iframe.replaceWith(image)
  }
}
