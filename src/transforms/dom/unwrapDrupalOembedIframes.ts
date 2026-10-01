import { parseUrl } from 'trousse'
import type { DomTransform } from '../../types.js'
import { getLazyValue } from '../../utils/dom.js'
import { isUrlShaped, placeholderBaseUrl } from '../../utils/urls.js'

// Drupal's /media/oembed frame around a remote video, naming the site rather than the provider,
// so the placeholder gets no poster, no shape and no provider.
// The query is `url={page url}&max_width=0&max_height=0&hash=…`, and the hash is tied to the
// site.
export const unwrapDrupalOembedIframes: DomTransform = (context) => {
  // A lazy loader or cookie gate parks the proxy url in its own attribute, and the proxy refuses
  // framing, so fixLazyIframes promoting it later would still leave a blank frame.
  const attributes = ['src', ...context.lazyIframeAttributes]

  return (document) => {
    for (const iframe of document.querySelectorAll('iframe')) {
      const proxyUrl = getLazyValue(iframe, attributes, (value) => value.includes('/media/oembed?'))
      const url = parseUrl(proxyUrl ?? '', placeholderBaseUrl)?.searchParams.get('url')

      // Requiring a scheme here drops protocol-relative and site-relative urls later passes resolve.
      if (!url || !isUrlShaped(url)) {
        continue
      }

      iframe.setAttribute('src', url)
    }
  }
}
