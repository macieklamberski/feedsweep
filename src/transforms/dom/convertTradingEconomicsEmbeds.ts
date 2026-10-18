import type { DomTransform } from '../../types.js'
import { attr, getElementDimensions, parsePixelSize } from '../../utils/dom.js'
import { parseUrlOnHosts } from '../../utils/urls.js'
import { createImage, createLinkedImage } from '../../utils/widgets.js'

const hosts = ['tradingeconomics.com', 'd3fy651gv2fhd3.cloudfront.net']
const embedPathRegex = /^\/embed\/?$/i

// A Trading Economics chart iframe, whose page holds nothing but one static PNG of the chart.
// tradingeconomics.com serves that PNG at /charts/embed.png with the iframe's own query.
export const convertTradingEconomicsEmbeds: DomTransform = () => (document) => {
  for (const iframe of document.querySelectorAll('iframe')) {
    const url = parseUrlOnHosts(attr(iframe, 'src'), hosts)

    if (!url || !embedPathRegex.test(url.pathname) || !url.searchParams.get('s')) {
      continue
    }

    // WordPress writes `&#038;` for `&`, and some feeds then percent-encode its `#`, leaving
    // `&%23038;` between query pairs, which hides `h`, `w` and `ref` from Trading Economics.
    url.search = url.search.replaceAll('&%23038;', '&')

    const ref = url.searchParams.get('ref')
    const dimensions = getElementDimensions(iframe)

    const fields = {
      src: `https://tradingeconomics.com/charts/embed.png${url.search}`,
      width: dimensions.width ?? parsePixelSize(url.searchParams.get('w')),
      height: dimensions.height ?? parsePixelSize(url.searchParams.get('h')),
    }

    // `ref` is the path of the indicator's page. Without it the frame links only the home
    // page, which says nothing about the chart, so the image goes unlinked.
    const image = ref?.startsWith('/')
      ? createLinkedImage(document, { ...fields, href: `https://tradingeconomics.com${ref}` })
      : createImage(document, fields)

    iframe.replaceWith(image)
  }
}
