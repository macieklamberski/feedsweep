import { encodePathSegment, getPathSegments, getQueryParam, isAnyOf, isHostOf } from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  ResolveUrlEmbed,
  TransformContext,
} from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver, readCleanedFlashVar } from '../utils/widgets.js'

const provider = 'mrcvideo'

const sizes = {
  player: { ratio: '16/9' },
}

// Exact: `cdn.mrcvideo.org` serves the video files. `mrctv.org` and `www.mrctv.org` 301 onto
// `mrcvideo.org/embed/{same id}`.
const hosts = ['mrcvideo.org', 'mrctv.org', 'www.mrctv.org']

// The sharing snippet in the Flash player's flashvars lost the closing quote of its `src`.
const sharingSrcRegex = /src="([^"\s]+)/

const composeEmbed = (id: string): EmbedResolverResult => {
  // No `url`: the oEmbed endpoint answers only the slug page, which the id cannot compose.
  return {
    provider,
    id,
    src: `https://mrcvideo.org/embed/${encodePathSegment(id)}`,
    ...sizes.player,
  }
}

// The route word answers in any case.
const readEmbedId = (url: URL | undefined): string | undefined => {
  if (!url) {
    return
  }

  const [route, id, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, 'embed') || rest.length > 0) {
    return
  }

  return id
}

const readSharingId = (element: Element | undefined): string | undefined => {
  const code = flashVar(element, 'sharing.code')

  const src = code?.match(sharingSrcRegex)?.[1]
  const player = parseUrlOnHosts(src, hosts, isHostOf)

  return readEmbedId(player)
}

const readCallbackId = (
  element: Element | undefined,
  context: TransformContext | undefined,
): string | undefined => {
  const callback = readCleanedFlashVar(element, 'yourlytics.callback', context)
  const parsed = parseUrlOnHosts(callback, hosts, isHostOf)

  return getQueryParam(parsed?.searchParams, 'nodeid')
}

const mrcvideoResolveEmbed: ResolveUrlEmbed = (url) => {
  const id = readEmbedId(url)

  if (!id) {
    return
  }

  return composeEmbed(id)
}

// MRC Video's embed iframe, `/embed/{id}`, on the current host and the former MRCTV ones.
export const mrcvideoIframeEmbedResolver = createUrlEmbedResolver(hosts, mrcvideoResolveEmbed, {
  isOnHost: isHostOf,
})

const mrcvideoFlashResolveEmbed: ResolveUrlEmbed = (url, element, context) => {
  const [directory, file, ...rest] = getPathSegments(url)

  if (!isAnyOf(directory, 'jwplayer') || !isAnyOf(file, 'player.swf') || rest.length > 0) {
    return
  }

  const id = readSharingId(element) ?? readCallbackId(element, context)

  if (!id) {
    return
  }

  return composeEmbed(id)
}

// The former MRCTV JW Player Flash embed, dead since Flash. Its flashvars name an mp4 by file id,
// and the node id the embed page takes only in the sharing snippet and the view callback.
export const mrcvideoFlashEmbedResolver = createUrlEmbedResolver(hosts, mrcvideoFlashResolveEmbed, {
  isOnHost: isHostOf,
})

// The player calls `play()` when its query holds `autoplay`, whatever the value.
export const mrcvideoRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
