import { composeQuery, getPathSegments, getQueryParams, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'listennotes'

// The embed dialog writes each player at a fixed height, and none of them grows with its width.
const sizes = {
  episode: { height: 180 },
  podcast: { height: 600 },
  clip: { height: 300 },
  playlist: { height: 600 },
}

const hosts = ['listennotes.com']

const listennotesOrigin = 'https://www.listennotes.com'

const clipRouteWords = ['clips', 'podcast-clips']

// The episode player starts at `t`, in seconds. The clip player ignores it for its own start.
const episodeParams = ['t']

// A locale such as `fr` or `zh-hant` can open the path, ahead of the route word. Two letters tell
// it from a route word such as `podcasts` or `podcast-clips`, which opens the path in its place.
const localeRegex = /^[a-z]{2}(?:-[a-z]+)?$/i
// The short id is the last 11 characters of a slugged segment, after a hyphen. The slug is free
// text the server ignores, and the id can hold a hyphen of its own.
const shortIdRegex = /-([^/]{11})$/

type Slugged = {
  kind: string
  slug: string
  playerPath: string
  pagePath: string
  size: { height: number }
  title: string | undefined
  query?: string
}

const composeSlugged = (slugged: Slugged): EmbedResolverResult | undefined => {
  const shortId = shortIdRegex.exec(slugged.slug)?.[1]

  if (!shortId) {
    return
  }

  return {
    provider,
    id: `${slugged.kind}/${shortId}`,
    src: `${listennotesOrigin}/${slugged.playerPath}/embed/${slugged.query ?? ''}`,
    url: `${listennotesOrigin}/${slugged.pagePath}/`,
    ...slugged.size,
    title: slugged.title,
  }
}

export const listennotesResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const segments = getPathSegments(url)
  const [locale = ''] = segments

  if (localeRegex.test(locale)) {
    segments.shift()
  }

  const [route = '', slug = '', item, embed] = segments
  const title = attr(element, 'title')
  const episodeQuery = composeQuery(getQueryParams(url.search, episodeParams))

  if (!item) {
    return
  }

  // The hex episode id this route takes 301s to the slugged player, which no offline map reaches.
  if (isAnyOf(route, 'embedded') && isAnyOf(slug, 'e')) {
    return {
      provider,
      id: `episode/${item}`,
      src: `${listennotesOrigin}/embedded/e/${item}/${episodeQuery}`,
      url: `${listennotesOrigin}/e/${item}/`,
      ...sizes.episode,
      title,
    }
  }

  if (isAnyOf(route, 'podcasts') && isAnyOf(item, 'embed')) {
    const path = `podcasts/${slug}`

    return composeSlugged({
      kind: 'podcast',
      slug,
      playerPath: path,
      pagePath: path,
      size: sizes.podcast,
      title,
    })
  }

  if (isAnyOf(route, 'podcasts') && isAnyOf(embed, 'embed')) {
    const path = `podcasts/${slug}/${item}`

    return composeSlugged({
      kind: 'episode',
      slug: item,
      playerPath: path,
      pagePath: path,
      size: sizes.episode,
      title,
      query: episodeQuery,
    })
  }

  // `clips` 301s to `podcast-clips`, the route the embed dialog writes today.
  if (isAnyOf(route, clipRouteWords) && isAnyOf(item, 'embed')) {
    const path = `podcast-clips/${slug}`

    return composeSlugged({
      kind: 'clip',
      slug,
      playerPath: path,
      pagePath: path,
      size: sizes.clip,
      title,
    })
  }

  // `listen/{slug}/{podcasts|episodes}/embed/` lists a playlist's podcasts or its episodes, and
  // the page for it lives under `playlists`.
  if (isAnyOf(route, 'listen') && isAnyOf(embed, 'embed')) {
    return composeSlugged({
      kind: 'playlist',
      slug,
      playerPath: `listen/${slug}/${item}`,
      pagePath: `playlists/${slug}/${item}`,
      size: sizes.playlist,
      title,
    })
  }
}

// Listen Notes' episode, podcast, clip and playlist player iframes.
export const listennotesEmbedResolver = createUrlEmbedResolver(hosts, listennotesResolveEmbed)
