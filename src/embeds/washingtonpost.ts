import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { parseUrlOnHosts, uuidRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'washingtonpost'

const washingtonpostHosts = ['washingtonpost.com']

const embedPathRegex = /^\/video\/c\/embed\/([^/]+)\/?$/
const inlinePathRegex = /\/([^/]+)_inline\.html$/

// The Washington Post video player. The 2012 inline player, `/{section}/{slug}/{y}/{m}/{d}/
// {id}_inline.html`, answers 504 for every id. One whose id is a video uuid plays on the embed
// route, and the older `gJQA…` ids name no uuid.
export const washingtonpostResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, washingtonpostHosts)

  if (!parsed) {
    return
  }

  const id =
    parsed.pathname.match(embedPathRegex)?.[1] ??
    keepIfMatches(parsed.pathname.match(inlinePathRegex)?.[1], uuidRegex)

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.washingtonpost.com/video/c/embed/${id}`,
    ratio: '16/9',
  }
}

export const washingtonpostEmbedResolver = createUrlEmbedResolver(
  washingtonpostHosts,
  washingtonpostResolveEmbed,
)
