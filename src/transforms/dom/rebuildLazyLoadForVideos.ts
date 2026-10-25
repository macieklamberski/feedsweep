import { parseUrl } from 'trousse'
import { vimeoResolveEmbed } from '../../embeds/vimeo.js'
import { youtubeResolveEmbed } from '../../embeds/youtube.js'
import type { DomTransform } from '../../types.js'
import { placeholderBaseUrl, repairCarrierUrl } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

// Lazy Load for Videos ships a facade anchor with the watch url and builds the iframe on click.
export const rebuildLazyLoadForVideos: DomTransform = () => (document) => {
  for (const anchor of document.querySelectorAll('a.preview-lazyload')) {
    // The plugin writes Vimeo's api path, `/videos/{id}`, in data-video-uri and the watch url in
    // href, so each is offered in turn.
    const urls = [anchor.getAttribute('data-video-uri'), anchor.getAttribute('href')]

    let source: string | undefined

    for (const url of urls) {
      if (source) {
        break
      }

      if (!url) {
        continue
      }

      const parsed = parseUrl(url, placeholderBaseUrl)
      const repaired = parseUrl(repairCarrierUrl(url), placeholderBaseUrl)

      if (!parsed || !repaired) {
        continue
      }

      // The YouTube reader takes its url past the glued-query and whitespace repairs a frame src
      // gets, and the Vimeo reader takes it as written. A hand-built embed url drops the ?h= hash
      // an unlisted Vimeo needs.
      source = youtubeResolveEmbed(repaired)?.src ?? vimeoResolveEmbed(parsed)?.src
    }

    if (!source) {
      continue
    }

    const facade = anchor.closest('.container-lazyload') ?? anchor
    const iframe = createIframe(document, source)

    const videoTitle = anchor.getAttribute('data-video-title')
    if (videoTitle) {
      iframe.setAttribute('title', videoTitle)
    }

    facade.replaceWith(iframe)
  }
}
