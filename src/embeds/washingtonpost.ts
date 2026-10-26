import type { ResolveUrlEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { uuidRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'washingtonpost'

const sizes = {
  player: { ratio: '16/9' },
}

const hosts = ['washingtonpost.com']

const embedPathRegex = /^\/video\/c\/embed\/([^/]+)\/?$/i
const inlinePathRegex = /\/([^/]+)_inline\.html$/i

// The Washington Post video player. The 2012 inline player, `{id}_inline.html`, is rebuilt onto
// the embed route when its id is a video uuid. The older `gJQA…` ids name no uuid.
export const washingtonpostResolveEmbed: ResolveUrlEmbed = (url) => {
  const id =
    url.pathname.match(embedPathRegex)?.[1] ??
    keepIfMatches(url.pathname.match(inlinePathRegex)?.[1], uuidRegex)

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.washingtonpost.com/video/c/embed/${id}`,
    ...sizes.player,
  }
}

export const washingtonpostEmbedResolver = createUrlEmbedResolver(hosts, washingtonpostResolveEmbed)
