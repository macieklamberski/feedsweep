import { parseUrl, toMap } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, text } from '../utils/dom.js'
import { composeQuery, parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pixiv'

const loaderHosts = ['source.pixiv.net', 's.pximg.net']
const frameHosts = ['embed.pixiv.net']
const pixivHosts = ['pixiv.net']

// A work id is the illustration's number and an upload hash. The endpoint keys on the number.
const illustIdRegex = /^(\d+)(?:_[0-9a-f]+)?$/
const workPathRegex = /^\/(?:member_illust\.php|artworks\/\d+)$/
const artistPathRegex = /^\/(?:member\.php|users\/\d+)$/
const framePathRegex = /^\/(code|embed_mk2|fixed|oembed_iframe)\.php$/

// The bordered frame's box per `data-size`: the loader's own table plus 30 for the border. The
// borderless frame takes the illustration's size, which only a request to pixiv answers.
const borderedSizes = toMap({
  small: { width: 220, height: 250 },
  medium: { width: 390, height: 300 },
  large: { width: 700, height: 550 },
})

const composeFrameUrl = (workId: string, size: string, border: string): string => {
  return `https://embed.pixiv.net/embed_mk2.php${composeQuery({ id: workId, size, border })}`
}

const findAnchor = (anchors: Array<Element>, pathRegex: RegExp): Element | undefined => {
  return anchors.find((anchor) => {
    const url = parseUrlOnHosts(attr(anchor, 'href'), pixivHosts)

    return url && pathRegex.test(url.pathname)
  })
}

const pixivResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url)

  if (!parsed) {
    return
  }

  const route = parsed.pathname.match(framePathRegex)?.[1]
  const workId = parsed.searchParams.get('id')

  if (!route || !workId) {
    return
  }

  const illustId = workId.match(illustIdRegex)?.[1]
  const page = illustId ? `https://www.pixiv.net/artworks/${illustId}` : undefined

  if (route === 'embed_mk2') {
    return {
      provider,
      id: workId,
      src: `https://embed.pixiv.net/embed_mk2.php${pickUrlParams(url, ['id', 'size', 'border'])}`,
      url: page,
    }
  }

  // `type` picks the id space, and a novel's number reads the same as an illustration's.
  if (route === 'oembed_iframe' && parsed.searchParams.get('type') !== 'illust') {
    return
  }

  // The host redirects `http:` to `https:` on every route.
  return {
    provider,
    id: workId,
    src: `https://embed.pixiv.net${parsed.pathname}${parsed.search}`,
    url: page,
  }
}

// pixiv's illustration embed: a loader script naming the work in `data-id`, the box in
// `data-size` and the frame style in `data-border`, with a <noscript> beside it naming the title
// and the author. The loader writes a frame onto `embed.pixiv.net/embed_mk2.php`.
export const pixivScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="source.pixiv.net/source/embed.js"][data-id], script[src*="s.pximg.net/source/embed.js"][data-id]',
  (element) => {
    const workId = attr(element, 'data-id')
    const size = attr(element, 'data-size') ?? ''
    const border = attr(element, 'data-border')
    const bordered = borderedSizes.get(size)

    // The selector matches a substring any host can carry. pixiv's loader also renders nothing
    // without all three attributes.
    if (!parseUrlOnHosts(attr(element, 'src'), loaderHosts) || !workId || !bordered || !border) {
      return
    }

    // A page saved after the loader ran keeps the filled `div.pixiv-embed` of the same work, and
    // its frame is read by pixivIframeEmbedResolver. A paragraph can separate the two.
    const mounts = element.ownerDocument.querySelectorAll('div.pixiv-embed[data-done][data-id]')

    for (const mount of mounts) {
      if (attr(mount, 'data-id') === workId) {
        return
      }
    }

    const illustId = workId.match(illustIdRegex)?.[1]
    const isBordered = border === 'on'
    const box = isBordered ? bordered : undefined
    const fallback = element.nextElementSibling
    const anchors =
      fallback?.localName === 'noscript' ? Array.from(fallback.querySelectorAll('a[href]')) : []
    // A block holding any anchor off pixiv is another publisher's markup and is neither read nor
    // removed.
    const isPixivBlock = anchors.every((anchor) => {
      return parseUrlOnHosts(attr(anchor, 'href'), pixivHosts)
    })
    const work = isPixivBlock ? findAnchor(anchors, workPathRegex) : undefined
    const artist = isPixivBlock ? findAnchor(anchors, artistPathRegex) : undefined
    const result: EmbedResolverResult = {
      provider,
      id: workId,
      src: composeFrameUrl(workId, size, isBordered ? 'on' : 'off'),
      url: illustId ? `https://www.pixiv.net/artworks/${illustId}` : undefined,
      width: box?.width,
      height: box?.height,
      title: text(work),
      author: text(artist),
    }

    // The credits name the same work and would show as a second caption under the frame.
    if (work) {
      fallback?.remove()
    }

    return result
  },
)

// pixiv's frames on `embed.pixiv.net`: the loader's `embed_mk2.php`, the older `code.php` card,
// Hatena Blog's `fixed.php` and the oEmbed `oembed_iframe.php`.
export const pixivIframeEmbedResolver = createUrlEmbedResolver(frameHosts, pixivResolveEmbed, {
  preferResolverSize: true,
})
