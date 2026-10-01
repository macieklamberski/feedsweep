import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'listennotes'

const listennotesHosts = ['listennotes.com']

const listennotesOrigin = 'https://www.listennotes.com'

const clipRouteWords = ['clips', 'podcast-clips']

// The embed dialog writes each player at a fixed height, and none of them grows with its width.
const episodeHeight = 180
const podcastHeight = 600
const clipHeight = 300
const playlistHeight = 600

// A locale such as `fr` or `zh-hant` can open the path, ahead of the route word.
const localeRegex = /^[a-z]{2}(?:-[a-z]+)?$/
// The short id is the last 11 characters of a slugged segment, after a hyphen. The slug is free
// text the server ignores, and the id can hold a hyphen of its own.
const shortIdRegex = /-([^/]{11})$/

type Slugged = {
  kind: string
  slug: string
  playerPath: string
  pagePath: string
  height: number
  title: string | undefined
}

const composeSlugged = (slugged: Slugged): EmbedResolverResult | undefined => {
  const shortId = slugged.slug.match(shortIdRegex)?.[1]

  if (!shortId) {
    return
  }

  return {
    provider,
    id: `${slugged.kind}/${shortId}`,
    src: `${listennotesOrigin}/${slugged.playerPath}/embed/`,
    url: `${listennotesOrigin}/${slugged.pagePath}/`,
    height: slugged.height,
    title: slugged.title,
  }
}

export const listennotesResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, listennotesHosts)
  const segments = parsed ? getPathSegments(parsed) : []

  if (localeRegex.test(segments[0] ?? '')) {
    segments.shift()
  }

  const [route = '', first = '', second, third] = segments
  const title = attr(element, 'title')

  if (!second) {
    return
  }

  // The hex episode id this route takes 301s to the slugged player, which no offline map reaches.
  if (route === 'embedded' && first === 'e') {
    return {
      provider,
      id: `episode/${second}`,
      src: `${listennotesOrigin}/embedded/e/${second}/`,
      url: `${listennotesOrigin}/e/${second}/`,
      height: episodeHeight,
      title,
    }
  }

  if (route === 'podcasts' && second === 'embed') {
    const path = `podcasts/${first}`

    return composeSlugged({
      kind: 'podcast',
      slug: first,
      playerPath: path,
      pagePath: path,
      height: podcastHeight,
      title,
    })
  }

  if (route === 'podcasts' && third === 'embed') {
    const path = `podcasts/${first}/${second}`

    return composeSlugged({
      kind: 'episode',
      slug: second,
      playerPath: path,
      pagePath: path,
      height: episodeHeight,
      title,
    })
  }

  // `clips` 301s to `podcast-clips`, the route the embed dialog writes today.
  if (clipRouteWords.includes(route) && second === 'embed') {
    const path = `podcast-clips/${first}`

    return composeSlugged({
      kind: 'clip',
      slug: first,
      playerPath: path,
      pagePath: path,
      height: clipHeight,
      title,
    })
  }

  // `listen/{slug}/{podcasts|episodes}/embed/` lists a playlist's podcasts or its episodes, and
  // the page for it lives under `playlists`.
  if (route === 'listen' && third === 'embed') {
    return composeSlugged({
      kind: 'playlist',
      slug: first,
      playerPath: `listen/${first}/${second}`,
      pagePath: `playlists/${first}/${second}`,
      height: playlistHeight,
      title,
    })
  }
}

// Listen Notes' episode, podcast, clip and playlist player iframes.
export const listennotesEmbedResolver = createUrlEmbedResolver(
  listennotesHosts,
  listennotesResolveEmbed,
)
