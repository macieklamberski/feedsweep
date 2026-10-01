import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'piktochart'

const piktochartHosts = [
  'create.piktochart.com',
  'magic.piktochart.com', // The retired host, which 301s `/embed/{uid}` onto `create.`
]

// The uid is `{id}-{slug}`, and both halves select the item: a wrong slug answers 404.
const embedPathRegex = /^\/embed\/([^/]+)\/?$/

// An infographic scales to the frame's width, so its height is the item's own length.
const embedRatio = '1/2'

const composePiktochartEmbed = (uid: string, title?: string): EmbedResolverResult => {
  return {
    provider,
    // The server folds the uid's case, and its og:url spells it in lowercase.
    id: uid.toLowerCase(),
    src: `https://create.piktochart.com/embed/${uid}`,
    url: `https://create.piktochart.com/output/${uid}`,
    ratio: embedRatio,
    title,
  }
}

// The share dialog's script snippet: an empty div the loader script fills with the infographic.
// Older snippets name the uid in `pikto-uid`.
export const piktochartWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.piktowrapper-embed[data-uid], div.piktowrapper-embed[pikto-uid]',
  (element) => {
    const uid = attr(element, 'data-uid') ?? attr(element, 'pikto-uid')

    if (!uid) {
      return
    }

    return composePiktochartEmbed(uid)
  },
)

const piktochartResolveEmbed: ResolveEmbed = (url, element) => {
  const uid = parseUrl(url, placeholderBaseUrl)?.pathname.match(embedPathRegex)?.[1]

  if (!uid) {
    return
  }

  return composePiktochartEmbed(uid, attr(element, 'title'))
}

export const piktochartIframeEmbedResolver = createUrlEmbedResolver(
  piktochartHosts,
  piktochartResolveEmbed,
)
