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

// Classic ids are 12 characters and share tokens 20. A share token's page lives on `/view/{id}/`,
// and `/p/{id}/` answers 404 for it, while a classic id's page answers only on `/p/{id}/`.
const shareTokenLength = 20
// Prezi answers 404 for a 40-character hex id on every player and page route.
const hexIdLength = 40

const composePageUrl = (id: string): string => {
  if (id.length === shareTokenLength) {
    return `https://prezi.com/view/${id}/`
  }

  return `https://prezi.com/p/${id}/`
}

const composeEmbed = (id: string, route = 'p'): EmbedResolverResult => {
  if (id.length === hexIdLength) {
    return {
      provider: 'prezi',
      id,
      url: composePageUrl(id),
    }
  }

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

  if (route === 'view' && third === 'embed') {
    return composeEmbed(second, 'view')
  }

  if (route === 'v' && second === 'embed' && third) {
    return composeVideoEmbed(third)
  }

  const id = readFrameId(segments)

  if (!id) {
    return
  }

  return composeEmbed(id)
}

export const preziEmbedResolver = createUrlEmbedResolver(preziHosts, preziResolveEmbed)
