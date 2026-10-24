import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const preziHosts = ['prezi.com']

// The Flash snippet's one loader, with the presentation named in flashvars and repeated in the
// element ids as `prezi_{id}` and `preziEmbed_{id}`.
const loaderPathRegex = /\/bin\/preziloader\.swf$/i
const elementIdRegex = /^prezi(?:Embed)?_(.+)/i

// Classic ids are 12 characters and share tokens 20. A share token's page lives on `/view/{id}/`,
// and `/p/{id}/` answers 404 for it, while a classic id's page answers only on `/p/{id}/`.
const shareTokenLength = 20

const composePageUrl = (id: string): string => {
  if (id.length === shareTokenLength) {
    return `https://prezi.com/view/${id}/`
  }

  return `https://prezi.com/p/${id}/`
}

const composeEmbed = (id: string, route = 'p'): EmbedResolverResult => {
  return {
    provider: 'prezi',
    id,
    src: `https://prezi.com/${route}/${id}/embed`,
    url: composePageUrl(id),
    ratio: '550/400',
  }
}

const composeVideoEmbed = (id: string): EmbedResolverResult => {
  return {
    provider: 'prezi',
    id,
    src: `https://prezi.com/v/embed/${id}/`,
    url: `https://prezi.com/v/view/${id}/`,
    ratio: '16/9',
  }
}

const readFrameId = ([route, second, third]: Array<string>): string | undefined => {
  if (isAnyOf(route, 'embed')) {
    return second
  }

  if (isAnyOf(route, 'p') && isAnyOf(second, 'embed')) {
    return third
  }

  if (isAnyOf(route, 'p') && isAnyOf(third, 'embed')) {
    return second
  }
}

// The Flash loader `prezi.com/bin/preziloader.swf`, which renders nothing, the frames
// `prezi.com/embed/{id}/`, `prezi.com/p/{id}/embed`, `prezi.com/view/{id}/embed` and Prezi Video's
// `prezi.com/v/embed/{id}/`, and `prezi.com/p/embed/{id}/`, which asks for a login.
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
  const [route, second, third] = segments

  if (isAnyOf(route, 'view') && isAnyOf(third, 'embed')) {
    return composeEmbed(second, 'view')
  }

  if (isAnyOf(route, 'v') && isAnyOf(second, 'embed') && third) {
    return composeVideoEmbed(third)
  }

  const id = readFrameId(segments)

  if (!id) {
    return
  }

  return composeEmbed(id)
}

export const preziEmbedResolver = createUrlEmbedResolver(preziHosts, preziResolveEmbed)
