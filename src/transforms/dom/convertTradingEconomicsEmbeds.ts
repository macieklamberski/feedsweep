import { getQueryParam } from 'trousse'
import type { DomTransform } from '../../types.js'
import { getElementDimensions, parsePixelSize } from '../../utils/dom.js'
import { createImage, createLinkedImage, readCarrierUrlOnHosts } from '../../utils/widgets.js'

const hosts = ['tradingeconomics.com', 'd3fy651gv2fhd3.cloudfront.net']
const embedPathRegex = /^\/embed\/?$/i

// A Trading Economics chart iframe, whose page holds nothing but one static PNG of the chart.
// tradingeconomics.com serves that PNG at /charts/embed.png with the iframe's own query.
export const convertTradingEconomicsEmbeds: DomTransform = (context) => (document) => {
  for (const iframe of document.querySelectorAll('iframe')) {
    const url = readCarrierUrlOnHosts(iframe, hosts, context)

    if (!url || !embedPathRegex.test(url.pathname) || !getQueryParam(url.searchParams, 's')) {
      continue
    }

    const ref = getQueryParam(url.searchParams, 'ref')
    const dimensions = getElementDimensions(iframe)

    const fields = {
      src: `https://tradingeconomics.com/charts/embed.png${url.search}`,
      width: dimensions.width ?? parsePixelSize(getQueryParam(url.searchParams, 'w')),
      height: dimensions.height ?? parsePixelSize(getQueryParam(url.searchParams, 'h')),
    }

    // `ref` is the path of the indicator's page. Without it the frame links only the home
    // page, which says nothing about the chart, so the image goes unlinked.
    const image = ref?.startsWith('/')
      ? createLinkedImage(document, { ...fields, href: `https://tradingeconomics.com${ref}` })
      : createImage(document, fields)

    iframe.replaceWith(image)
  }
}
