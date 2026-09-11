import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar, keepIfMatches } from '../utils/dom.js'
import { parseUrlOnHosts, urlSafeTokenRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const preziHosts = ['prezi.com']

// The Flash snippet's one loader, with the presentation named in flashvars and repeated in the
// element ids as `prezi_{id}` and `preziEmbed_{id}`.
const loaderPathRegex = /\/bin\/preziloader\.swf$/
const elementIdRegex = /^prezi(?:Embed)?_(.+)/

const composeEmbed = (id: string): EmbedResolverResult => {
  return {
    provider: 'prezi',
    id,
    src: `https://prezi.com/p/${id}/embed`,
    url: `https://prezi.com/p/${id}/`,
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
// `prezi.com/embed/{id}/` and `prezi.com/p/{id}/embed`, and `prezi.com/p/embed/{id}/`, which asks
// for a login. `/view/{id}` is another product with its own ids.
export const preziResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, preziHosts)

  if (!parsed) {
    return
  }

  if (loaderPathRegex.test(parsed.pathname)) {
    const named = flashVar(element, 'prezi_id') ?? attr(element, 'id')?.match(elementIdRegex)?.[1]
    const id = keepIfMatches(named, urlSafeTokenRegex)

    return id ? composeEmbed(id) : undefined
  }

  const id = keepIfMatches(readFrameId(getPathSegments(parsed)), urlSafeTokenRegex)

  return id ? composeEmbed(id) : undefined
}

export const preziEmbedResolver = createUrlEmbedResolver(preziHosts, preziResolveEmbed)
