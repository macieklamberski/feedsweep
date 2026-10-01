import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, text } from '../utils/dom.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
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

// The loader draws nothing for a `data-size` outside its own table.
const loaderSizes = ['small', 'medium', 'large']

// The frame fills any box. This is the box pixiv's oEmbed snippet gives every kind of work.
const frameWidth = 600
const frameHeight = 315

const readIllustId = (workId: string): string => {
  return workId.match(illustIdRegex)?.[1] ?? workId
}

// See: https://embed.pixiv.net/oembed.php?url=https://www.pixiv.net/artworks/149288339.
const composeFrameUrl = (illustId: string): string => {
  return `https://embed.pixiv.net/oembed_iframe.php${composeQuery({ type: 'illust', id: illustId })}`
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

  const illustId = readIllustId(workId)
  const page = illustIdRegex.test(workId) ? `https://www.pixiv.net/artworks/${illustId}` : undefined

  // `type` picks the id space, and a novel's number reads the same as an illustration's.
  if (route === 'oembed_iframe' && parsed.searchParams.get('type') !== 'illust') {
    return
  }

  return {
    provider,
    id: illustId,
    src: composeFrameUrl(illustId),
    url: page,
    width: frameWidth,
    height: frameHeight,
  }
}

// pixiv's illustration embed: a loader script naming the work in `data-id`, the box in
// `data-size` and the frame style in `data-border`, with a <noscript> beside it naming the title
// and the author. The loader writes a frame onto `embed.pixiv.net/embed_mk2.php`, and the result
// mints the frame pixiv's oEmbed answer names for the same work.
export const pixivScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="source.pixiv.net/source/embed.js"][data-id], script[src*="s.pximg.net/source/embed.js"][data-id]',
  (element) => {
    const workId = attr(element, 'data-id')
    const size = attr(element, 'data-size') ?? ''
    const border = attr(element, 'data-border')

    // The selector matches a substring any host can carry. pixiv's loader also renders nothing
    // without all three attributes.
    if (
      !parseUrlOnHosts(attr(element, 'src'), loaderHosts) ||
      !workId ||
      !loaderSizes.includes(size) ||
      !border
    ) {
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

    const illustId = readIllustId(workId)
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
      id: illustId,
      src: composeFrameUrl(illustId),
      url: illustIdRegex.test(workId) ? `https://www.pixiv.net/artworks/${illustId}` : undefined,
      width: frameWidth,
      height: frameHeight,
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
export const pixivIframeEmbedResolver = createUrlEmbedResolver(frameHosts, pixivResolveEmbed)
