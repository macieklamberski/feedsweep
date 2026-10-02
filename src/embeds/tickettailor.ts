import { getPathSegments } from 'trousse'
import type { EmbedResolverResult } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const provider = 'tickettailor'

const tickettailorHosts = ['tickettailor.com']

// A ticket list's height follows its events, and the frame reports one only after the parent's
// iframe-resizer handshake.
const widgetHeight = 451

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
    height: widgetHeight,
  }
}

// Ticket Tailor's inline widget: `widget.js` reads the box or event page off `data-url` and
// frames it in place, and the pipeline drops the script. The loader acts only on a script inside
// the snippet's `.tt-widget` div or one marked inline.
export const tickettailorScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="tickettailor"][data-url], script[src*="tt-widget.js"][data-url]',
  (element) => {
    const isInline =
      attr(element, 'data-type') === 'inline' ||
      element.parentElement?.classList.contains('tt-widget')

    if (!isInline) {
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
