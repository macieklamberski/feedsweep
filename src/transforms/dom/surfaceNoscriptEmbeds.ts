import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { resolveOrKeepUrl } from '../../utils/urls.js'
import { isResolvedIframe } from '../../utils/widgets.js'

// A lazy-load plugin's <noscript> fallback iframe, which a reader hides along with the noscript.
// WP Rocket LazyLoad and a3 Lazy Load wrap the original video <iframe> this way.
export const surfaceNoscriptEmbeds: DomTransform = (context) => async (document) => {
  for (const noscript of document.querySelectorAll('noscript')) {
    const iframe = noscript.querySelector('iframe[src]')
    const src = iframe ? resolveOrKeepUrl(attr(iframe, 'src'), context) : undefined

    if (!iframe || !src) {
      continue
    }

    // The resolvers read a host, which a protocol-relative src names only once resolved.
    iframe.setAttribute('src', src)

    // Ungated, this would surface Google Tag Manager, reCAPTCHA and ad-network noscript frames.
    if (!(await isResolvedIframe(iframe, context.widgetResolvers))) {
      continue
    }

    const parent = noscript.parentNode
    if (!parent) {
      continue
    }

    while (noscript.firstChild) {
      parent.insertBefore(noscript.firstChild, noscript)
    }

    noscript.remove()
  }
}
