import { encodePathSegment, getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'prezi'

const hosts = ['prezi.com']
const designHosts = [
  'prezi.com',
  'prezi-nocookies.com', // The host Prezi Design's loader frames the design on
]

const sizes = {
  presentation: { ratio: '550/400' },
  video: { ratio: '16/9' },
  // A design draws at its own page shape, which its height tracks at any width.
  design: { ratio: '16/9' },
}

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
    provider,
    id,
    src: `https://prezi.com/${route}/${id}/embed`,
    url: composePageUrl(id),
    ...sizes.presentation,
  }
}

const composeVideoEmbed = (id: string): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `https://prezi.com/v/embed/${id}/`,
    url: `https://prezi.com/v/view/${id}/`,
    ...sizes.video,
  }
}

const readFrameId = ([route, idOrEmbed, embedOrId]: Array<string>): string | undefined => {
  if (isAnyOf(route, 'embed')) {
    return idOrEmbed
  }

  if (isAnyOf(route, 'p') && isAnyOf(idOrEmbed, 'embed')) {
    return embedOrId
  }

  if (isAnyOf(route, 'p') && isAnyOf(embedOrId, 'embed')) {
    return idOrEmbed
  }
}

// The Flash loader `prezi.com/bin/preziloader.swf`, which renders nothing, the frames
// `prezi.com/embed/{id}/`, `prezi.com/p/{id}/embed`, `prezi.com/view/{id}/embed` and Prezi Video's
// `prezi.com/v/embed/{id}/`, and `prezi.com/p/embed/{id}/`, which asks for a login.
export const preziResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (loaderPathRegex.test(url.pathname)) {
    const flashId = flashVar(element, 'prezi_id')
    const declaredId = flashId ? flashId : attr(element, 'id')?.match(elementIdRegex)?.[1]
    // The flashvar and the element id come out decoded, and the id goes into a path.
    const id = encodePathSegment(declaredId ?? '')

    if (!id) {
      return
    }

    return composeEmbed(id)
  }

  const segments = getPathSegments(url)
  const [route, idOrEmbed, embedOrId] = segments

  if (isAnyOf(route, 'view') && isAnyOf(embedOrId, 'embed')) {
    return composeEmbed(idOrEmbed, 'view')
  }

  if (isAnyOf(route, 'v') && isAnyOf(idOrEmbed, 'embed') && embedOrId) {
    return composeVideoEmbed(embedOrId)
  }

  const id = readFrameId(segments)

  if (!id) {
    return
  }

  return composeEmbed(id)
}

export const preziEmbedResolver = createUrlEmbedResolver(hosts, preziResolveEmbed)

const composeDesignEmbed = (id: string): EmbedResolverResult => {
  return {
    provider,
    // Qualified because a design id and a share token share one 20-character grammar.
    id: `design/${id}`,
    // `prezi.com/i/{id}/` answers 404 for a real design, so no page url goes beside it.
    src: `https://prezi.com/i/embed/${id}`,
    ...sizes.design,
  }
}

// The frame Prezi Design's loader writes, `prezi-nocookies.com/i/embed/{id}`, or the same route on
// `prezi.com`.
const preziDesignResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, embed, id] = getPathSegments(url)

  if (!isAnyOf(route, 'i') || !isAnyOf(embed, 'embed') || !id) {
    return
  }

  return composeDesignEmbed(id)
}

export const preziDesignIframeEmbedResolver = createUrlEmbedResolver(
  designHosts,
  preziDesignResolveEmbed,
)

// Prezi Design's embed: a `div.prezi-design-embed` naming the design in `data-project-id`, which
// `e.prezicdn.net/v1/design.js` fills with the design's frame.
export const preziDesignWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.prezi-design-embed[data-project-id]',
  (element) => {
    const id = attr(element, 'data-project-id')

    if (!id) {
      return
    }

    // The loader sits right before the mount in the snippet, and renders nothing in a reader.
    const loader = element.previousElementSibling

    if (loader?.localName === 'script' && parseUrlOnHosts(attr(loader, 'src'), 'e.prezicdn.net')) {
      loader.remove()
    }

    // The id comes out of its attribute decoded, and it goes into a path.
    return composeDesignEmbed(encodePathSegment(id))
  },
)
