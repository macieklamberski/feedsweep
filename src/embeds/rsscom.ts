import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readObjectHeight } from '../utils/hints.js'
import { composeQuery, parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'rsscom'

const rsscomHosts = ['player.rss.com']

// The player reads a numeric second segment as an episode, and `latest` as the newest episode.
const episodeIdRegex = /^\d+$/

// The player draws its older layout unless `v=2` asks for the one the embed dialog writes.
const playerParams = { v: '2' }

// An RSS.com podcast player, framed as `/{slug}/{episodeId}` for an episode and `/{slug}` for the
// show with its episode list.
export const rsscomResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, rsscomHosts)

  if (!parsed) {
    return
  }

  const [slug, episodeId, ...rest] = getPathSegments(parsed)

  if (!slug || rest.length > 0) {
    return
  }

  const query = composeQuery({ ...playerParams, ...pickQueryParams(parsed.search, ['time']) })
  const title = attr(element, 'title')

  if (!episodeId) {
    return {
      provider,
      id: slug,
      src: `https://player.rss.com/${slug}${query}`,
      url: `https://rss.com/podcasts/${slug}/`,
      title,
    }
  }

  if (!episodeIdRegex.test(episodeId)) {
    return
  }

  return {
    provider,
    id: `${slug}/${episodeId}`,
    src: `https://player.rss.com/${slug}/${episodeId}${query}`,
    url: `https://rss.com/podcasts/${slug}/${episodeId}/`,
    title,
  }
}

export const rsscomEmbedResolver = createUrlEmbedResolver(rsscomHosts, rsscomResolveEmbed)

// The player posts its rendered height unasked as `{ height }`, again whenever it changes.
export const rsscomRenderHint: EmbedRenderHint = {
  provider,
  readHeight: readObjectHeight,
}
