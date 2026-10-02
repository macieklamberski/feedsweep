import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import { attr } from '../utils/dom.js'
import { iframeResizerHeightRequest, readIframeResizerHeight } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const provider = 'tickettailor'

const tickettailorHosts = ['tickettailor.com']

const readKey = (segments: Array<string>): string | undefined => {
  const [route, first, second, third, fourth, fifth] = segments

  if (route === 'all-tickets' && first) {
    return first
  }

  if (route === 'events' && first && second) {
    return `${first}/${second}`
  }

  // A checkout names the event by id beside a checksum it answers 404 without.
  if (route === 'checkout' && first === 'new-session' && second === 'id' && fourth === 'chk') {
    if (!fifth) {
      return
    }

    return `checkout/${third}`
  }
}

const composeEmbed = (page: URL): EmbedResolverResult | undefined => {
  const key = readKey(getPathSegments(page))

  if (!key) {
    return
  }

  const pageUrl = `https://www.tickettailor.com${page.pathname}`

  return {
    provider,
    id: key,
    src: `${pageUrl}?widget=true`,
    url: key.startsWith('checkout/') ? undefined : pageUrl,
  }
}

// The older `tt-widget.js` frames a script whose `data-type` is `inline`. The current `widget.js`
// frames one whose own `type` is `inline`, or whose parent's class is exactly `tt-widget`, so a
// script that WordPress wrapped in a paragraph inside the snippet's div stays a link.
const isInlineLoader = (element: Element): boolean => {
  if (attr(element, 'src')?.includes('tt-widget.js')) {
    return attr(element, 'data-type') === 'inline'
  }

  return (
    attr(element, 'type') === 'inline' ||
    element.parentElement?.getAttribute('class') === 'tt-widget'
  )
}

// Ticket Tailor's inline widget: the loader reads the box or event page off `data-url` and
// frames it in place, and the pipeline drops the script.
export const tickettailorScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="tickettailor"][data-url], script[src*="tt-widget.js"][data-url]',
  (element) => {
    if (!isInlineLoader(element)) {
      return
    }

    const page = parseUrlOnHosts(attr(element, 'data-url'), tickettailorHosts)

    if (!page) {
      return
    }

    const result = composeEmbed(page)

    if (!result) {
      return
    }

    // The snippet's fallback links to the same page, for a reader with no script.
    const siblings = [...(element.parentElement?.children ?? [])]
    const fallback = siblings.find((sibling) => sibling.classList.contains('tt-widget-fallback'))
    const fallbackLink = attr(fallback?.querySelector('a[href]'), 'href')

    if (fallback && parseUrlOnHosts(fallbackLink, tickettailorHosts)?.pathname === page.pathname) {
      fallback.remove()
    }

    return result
  },
)

// A ticket list's height follows its events, and the frame reports one only to a parent that
// starts iframe-resizer.
export const tickettailorRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://www.tickettailor.com',
  requestHeight: iframeResizerHeightRequest,
  readHeight: readIframeResizerHeight,
}
