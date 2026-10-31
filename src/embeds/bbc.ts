import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed, TransformContext } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { digitsRegex, flashFileRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver, readCleanedFlashVar } from '../utils/widgets.js'

const provider = 'bbc'

const sizes = {
  // The news and World Service players render at 16:9 of their width. BBC's own embed code
  // states a 400 by 500 box, which pads them with blank below.
  news: { ratio: '16/9' },
  // The programmes player is a 16:9 video above a panel of its title and links, which the box
  // clips.
  programmes: { ratio: '16/9' },
}

// `bbc.co.uk` 301s every player route onto `bbc.com`.
const hosts = ['bbc.com', 'bbc.co.uk']

// A programme id: eight letters and digits with at least one digit. Where no route fixes its slot,
// the shape keeps `articles` and the playlist route word `index` out.
const pidRegex = /^[a-z](?=[0-9a-z]*\d)[0-9a-z]{7}$/
const pidCharactersRegex = /^[0-9a-z]+$/
const playlistPathRegex = /\/playlist\/([^/.]+)/i
const newsPagePathRegex = /^\/news\/[^/]*-(?<article>\d+)\/?$/i

const isPid = (segment: string | undefined): segment is string => {
  return segment !== undefined && pidRegex.test(segment)
}

const isPidSlot = (segment: string | undefined): segment is string => {
  return segment !== undefined && pidCharactersRegex.test(segment)
}

const isArticleId = (segment: string | undefined): segment is string => {
  return segment !== undefined && digitsRegex.test(segment)
}

const composeNewsEmbed = (article: string, pid: string): EmbedResolverResult => {
  return {
    provider,
    id: pid,
    src: `https://www.bbc.com/news/av-embeds/${article}/vpid/${pid}`,
    ...sizes.news,
  }
}

const composeProgrammesEmbed = (pid: string, url?: string): EmbedResolverResult => {
  return {
    provider,
    id: pid,
    src: `https://www.bbc.co.uk/programmes/${pid}/player`,
    url,
    ...sizes.programmes,
  }
}

// The retired news player names its clip in `externalIdentifier` and its article in
// `embedPageUrl`, `/news/{slug}-{article}`, and states its poster in `holdingImage`.
const readNewsFlash = (
  element: Element | undefined,
  context: TransformContext | undefined,
): EmbedResolverResult | undefined => {
  const pid = flashVar(element, 'externalIdentifier')
  const page = parseUrlOnHosts(readCleanedFlashVar(element, 'embedPageUrl', context), hosts)
  const article = page?.pathname.match(newsPagePathRegex)?.groups?.article

  if (!isPidSlot(pid) || !article) {
    return
  }

  return {
    ...composeNewsEmbed(article, pid),
    thumbnail: readCleanedFlashVar(element, 'holdingImage', context),
  }
}

// BBC's news, World Service and programmes clip players, pasted in a portrait box that pads them,
// and the retired Flash player. A news page needs its section slug, which the embed does not
// carry, and a current programmes clip such as `p08s3bnj` has no page of its own.
export const bbcResolveEmbed: ResolveUrlEmbed = (url, element, context) => {
  // The retired Flash player names its clip in the `playlist` flashvar, as
  // `/iplayer/playlist/{pid}` or `/comedy/forge-assets/extra/playlist/{pid}.xml`. News and World
  // Service playlists carry no pid, and the news player names it in other flashvars.
  if (flashFileRegex.test(url.pathname)) {
    const playlist = parseUrlOnHosts(readCleanedFlashVar(element, 'playlist', context), hosts)
    const pid = playlist?.pathname.match(playlistPathRegex)?.[1]

    if (isPid(pid)) {
      return composeProgrammesEmbed(pid, `https://www.bbc.co.uk/programmes/${pid}`)
    }

    return readNewsFlash(element, context)
  }

  const segments = getPathSegments(url)
  const [section, player] = segments

  // `/news/av/embed/{pid}/{article}` 301s to `/news/av-embeds/{article}/vpid/{pid}`, and the
  // player answers 404 when either the pid or the article is fabricated.
  if (isAnyOf(section, 'news') && isAnyOf(player, 'av')) {
    const [, , route, pid, article] = segments

    if (!isAnyOf(route, 'embed') || !isPidSlot(pid)) {
      return
    }

    if (!isArticleId(article)) {
      return
    }

    return composeNewsEmbed(article, pid)
  }

  if (isAnyOf(section, 'news') && isAnyOf(player, 'av-embeds')) {
    const [, , article, route, pid] = segments

    if (!isArticleId(article) || !isAnyOf(route, 'vpid')) {
      return
    }

    if (!isPidSlot(pid)) {
      return
    }

    return composeNewsEmbed(article, pid)
  }

  // `/ws/av-embeds/articles/{article}/{pid}/{lang}/` is the same player app as the news one.
  if (isAnyOf(section, 'ws') && isAnyOf(player, 'av-embeds')) {
    const pid = segments.find(isPid)

    if (!pid) {
      return
    }

    return {
      provider,
      id: pid,
      src: `https://www.bbc.com${url.pathname}`,
      ...sizes.news,
    }
  }

  if (isAnyOf(section, 'programmes')) {
    const [, pid, route] = segments

    if (isPidSlot(pid) && isAnyOf(route, 'player')) {
      return composeProgrammesEmbed(pid)
    }
  }
}

export const bbcIframeEmbedResolver = createUrlEmbedResolver(hosts, bbcResolveEmbed)
