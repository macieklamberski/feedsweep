import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'mrcvideo'

// Exact: `cdn.mrcvideo.org` serves the video files. `mrctv.org` and `www.mrctv.org` 301 onto
// `mrcvideo.org/embed/{same id}`.
const mrcvideoHosts = ['mrcvideo.org', 'mrctv.org', 'www.mrctv.org']

// The sharing snippet in the Flash player's flashvars lost the closing quote of its `src`.
const sharingSrcRegex = /src="([^"\s]+)/

const composeEmbed = (id: string): EmbedResolverResult => {
  // No `url`: the oEmbed endpoint answers only the slug page, which the id cannot compose.
  return {
    provider,
    id,
    src: `https://mrcvideo.org/embed/${id}`,
    ratio: '16/9',
  }
}

const parseOnHosts = (url: string | undefined): URL | undefined => {
  const parsed = url ? parseUrl(url, placeholderBaseUrl) : undefined

  if (parsed && isHostOf(parsed, mrcvideoHosts)) {
    return parsed
  }
}

// The route word answers in any case.
const readEmbedId = (url: string | undefined): string | undefined => {
  const parsed = parseOnHosts(url)

  if (!parsed) {
    return
  }

  const [route, id, ...rest] = getPathSegments(parsed)

  if (!isAnyOf(route, 'embed') || rest.length > 0) {
    return
  }

  return id
}

const readSharingId = (element: Element | undefined): string | undefined => {
  const code = flashVar(element, 'sharing.code')

  return readEmbedId(code?.match(sharingSrcRegex)?.[1])
}

const readCallbackId = (element: Element | undefined): string | undefined => {
  const parsed = parseOnHosts(flashVar(element, 'yourlytics.callback'))

  return parsed?.searchParams.get('nodeid') ?? undefined
}

const mrcvideoResolveEmbed: ResolveEmbed = (url) => {
  const id = readEmbedId(url)

  if (!id) {
    return
  }

  return composeEmbed(id)
}

// MRC Video's embed iframe, `/embed/{id}`, on the current host and the former MRCTV ones.
export const mrcvideoEmbedResolver = createUrlEmbedResolver(mrcvideoHosts, mrcvideoResolveEmbed)

const mrcvideoFlashResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseOnHosts(url)

  if (!parsed) {
    return
  }

  const [directory, file, ...rest] = getPathSegments(parsed)

  if (!isAnyOf(directory, 'jwplayer') || !isAnyOf(file, 'player.swf') || rest.length > 0) {
    return
  }

  const id = readSharingId(element) ?? readCallbackId(element)

  if (!id) {
    return
  }

  return composeEmbed(id)
}

// The former MRCTV JW Player Flash embed, dead since Flash. Its flashvars name an mp4 by file id,
// and the node id the embed page takes only in the sharing snippet and the view callback.
export const mrcvideoFlashEmbedResolver = createUrlEmbedResolver(
  mrcvideoHosts,
  mrcvideoFlashResolveEmbed,
)

// The player calls `play()` when its query holds `autoplay`, whatever the value.
export const mrcvideoRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
