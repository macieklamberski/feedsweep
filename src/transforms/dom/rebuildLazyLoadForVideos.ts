import { resolveUrl } from 'trousse'
import { vimeoHosts, vimeoResolveEmbed } from '../../embeds/vimeo.js'
import { youtubeHosts, youtubeResolveEmbed } from '../../embeds/youtube.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { absoluteUrlRegex, parseUrlOnHosts } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

const vimeoOrigin = 'https://vimeo.com'

// The player src a facade url names, on either platform the plugin supports.
const readPlayerSrc = (url: string | undefined): string | undefined => {
  const youtube = parseUrlOnHosts(url, youtubeHosts)

  if (youtube) {
    return youtubeResolveEmbed(youtube)?.src
  }

  const vimeo = parseUrlOnHosts(url, vimeoHosts)

  if (vimeo) {
    return vimeoResolveEmbed(vimeo)?.src
  }
}

// Lazy Load for Videos ships a facade anchor with the watch url and builds the iframe on click.
export const rebuildLazyLoadForVideos: DomTransform = () => (document) => {
  for (const anchor of document.querySelectorAll('a.preview-lazyload')) {
    let uri = attr(anchor, 'data-video-uri')

    // The plugin writes Vimeo's api path, `/videos/{id}`, in data-video-uri, which names no host.
    if (uri && !absoluteUrlRegex.test(uri)) {
      uri = resolveUrl(uri, vimeoOrigin)
    }

    let source: string | undefined

    for (const url of [uri, attr(anchor, 'href')]) {
      source = readPlayerSrc(url)

      if (source) {
        break
      }
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
