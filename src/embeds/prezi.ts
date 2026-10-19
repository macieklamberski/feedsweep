import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const preziHosts = ['prezi.com']

// The Flash snippet's one loader, with the presentation named in flashvars and repeated in the
// element ids as `prezi_{id}` and `preziEmbed_{id}`.
const loaderPathRegex = /\/bin\/preziloader\.swf$/
const elementIdRegex = /^prezi(?:Embed)?_(.+)/

// A `/view/{id}` share token answers on `/p/{id}/embed` too, but its page lives on `/view/{id}/`.
const composeEmbed = (id: string, route = 'p'): EmbedResolverResult => {
  return {
    provider: 'prezi',
    id,
    src: `https://prezi.com/${route}/${id}/embed`,
    url: `https://prezi.com/${route}/${id}/`,
    ratio: '550/400',
  }
}

const readFrameId = ([route, second, third]: Array<string>): string | undefined => {
  if (route === 'embed') {
    return second
  }

  if (route === 'p' && second === 'embed') {
    return third
  }

  if (route === 'p' && third === 'embed') {
    return second
  }
}

// The Flash loader `prezi.com/bin/preziloader.swf`, which renders nothing, the frames
// `prezi.com/embed/{id}/`, `prezi.com/p/{id}/embed` and `prezi.com/view/{id}/embed`, and
// `prezi.com/p/embed/{id}/`, which asks for a login.
export const preziResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, preziHosts)

  if (!parsed) {
    return
  }

  if (loaderPathRegex.test(parsed.pathname)) {
    const flashId = flashVar(element, 'prezi_id')
    // The flashvar comes out decoded, and it goes into a path beside the raw path spelling.
    const id = flashId
      ? encodePathSegment(flashId)
      : attr(element, 'id')?.match(elementIdRegex)?.[1]

    if (!id) {
      return
    }

    return composeEmbed(id)
  }

  const segments = getPathSegments(parsed)
  const [route, viewId, viewWord] = segments

  if (route === 'view' && viewWord === 'embed') {
    return composeEmbed(viewId, 'view')
  }

  const id = readFrameId(segments)

  if (!id) {
    return
  }

  return composeEmbed(id)
}

export const preziEmbedResolver = createUrlEmbedResolver(preziHosts, preziResolveEmbed)
