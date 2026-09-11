import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar, keepIfMatches } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const preziHosts = ['prezi.com']

// A classic id is letters and digits.
const safeIdRegex = /^[a-z0-9]+$/i

// The Flash snippet's one loader, with the presentation named in flashvars and repeated in the
// element ids as `prezi_{id}` and `preziEmbed_{id}`.
const loaderPathRegex = /\/bin\/preziloader\.swf$/
const elementIdRegex = /^prezi(?:Embed)?_(.+)$/

const composeEmbed = (id: string): EmbedResolverResult => {
  return {
    provider: 'prezi',
    id,
    src: `https://prezi.com/p/${id}/embed`,
    url: `https://prezi.com/p/${id}/`,
  }
}

// The Flash loader `prezi.com/bin/preziloader.swf`, which renders nothing today, and the frames
// `prezi.com/embed/{id}/` and `prezi.com/p/{id}/embed`. A classic id still answers on the
// current route, and a fabricated one 404s. `/view/{id}` is another product with its own ids.
export const preziResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, preziHosts)

  if (!parsed) {
    return
  }

  if (loaderPathRegex.test(parsed.pathname)) {
    const named = flashVar(element, 'prezi_id') ?? attr(element, 'id')?.match(elementIdRegex)?.[1]
    const id = keepIfMatches(named, safeIdRegex)

    return id ? composeEmbed(id) : undefined
  }

  const [route, second, third] = getPathSegments(parsed)
  const id = keepIfMatches(
    route === 'embed' || (route === 'p' && third === 'embed') ? second : undefined,
    safeIdRegex,
  )

  return id ? composeEmbed(id) : undefined
}

export const preziEmbedResolver = createUrlEmbedResolver(preziHosts, preziResolveEmbed)
