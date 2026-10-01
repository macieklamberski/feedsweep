import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'piktochart'

const piktochartHosts = [
  'create.piktochart.com',
  'magic.piktochart.com', // The retired host, which 301s `/embed/{uid}` onto `create.`
]

// The uid is `{id}-{slug}`, and both halves select the item: a wrong slug answers 404.
const embedPathRegex = /^\/embed\/([^/]+)\/?$/

// An infographic scales to the frame's width, so its height is the item's own length.
const embedRatio = '1/2'

export const composePiktochartEmbedUrl = (uid: string): string => {
  return `https://create.piktochart.com/embed/${uid}`
}

const composePiktochartEmbed = (uid: string, title: string | undefined): EmbedResolverResult => {
  return {
    provider,
    // The server folds the uid's case, and its og:url spells it in lowercase.
    id: uid.toLowerCase(),
    src: composePiktochartEmbedUrl(uid),
    url: `https://create.piktochart.com/output/${uid}`,
    ratio: embedRatio,
    title,
  }
}

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
