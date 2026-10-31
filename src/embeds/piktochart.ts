import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'piktochart'

const hosts = [
  'create.piktochart.com',
  'magic.piktochart.com', // The retired host, which 301s `/embed/{uid}` onto `create.`
]

// The uid is `{id}-{slug}`, and both halves select the item: a wrong slug answers 404.
const embedPathRegex = /^\/embed\/([^/]+)\/?$/i

const sizes = {
  // An infographic scales to the frame's width, so its height is the item's own length.
  player: { ratio: '1/2' },
}

export const composeEmbedUrl = (uid: string): string => {
  return `https://create.piktochart.com/embed/${uid}`
}

const composePiktochartEmbed = (uid: string, title: string | undefined): EmbedResolverResult => {
  return {
    provider,
    id: uid,
    src: composeEmbedUrl(uid),
    url: `https://create.piktochart.com/output/${uid}`,
    ...sizes.player,
    title,
  }
}

const piktochartResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const uid = url.pathname.match(embedPathRegex)?.[1]

  if (!uid) {
    return
  }

  return composePiktochartEmbed(uid, attr(element, 'title'))
}

// Piktochart's infographic iframe, `/embed/{uid}` on the current host or the retired one.
export const piktochartIframeEmbedResolver = createUrlEmbedResolver(hosts, piktochartResolveEmbed)
