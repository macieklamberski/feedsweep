import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { digitsRegex, flashFileRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `bbc.co.uk` 301s every player route onto `bbc.com`.
const bbcHosts = ['bbc.com', 'bbc.co.uk']
const bbcImageHosts = ['bbcimg.co.uk']

// A programme id: eight letters and digits with at least one digit. Where no route fixes its slot,
// the shape keeps `articles` and the playlist route word `index` out.
const pidRegex = /^[a-z](?=[0-9a-z]*\d)[0-9a-z]{7}$/
const pidCharactersRegex = /^[0-9a-z]+$/
const playlistPathRegex = /\/playlist\/([^/.]+)/
const newsPagePathRegex = /^\/news\/[^/]*-(?<article>\d+)\/?$/

// The news and World Service players render at 16:9 of their width. BBC's own embed code states
// a 400 by 500 box, which pads them with blank below.
const newsPlayerRatio = '16/9'
// The programmes player is a 16:9 video above a panel of its title and links, which the box clips.
const programmesPlayerRatio = '16/9'

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
    provider: 'bbc',
    id: pid,
    src: `https://www.bbc.com/news/av-embeds/${article}/vpid/${pid}`,
    ratio: newsPlayerRatio,
  }
}

const composeProgrammesEmbed = (pid: string, url?: string): EmbedResolverResult => {
  return {
    provider: 'bbc',
    id: pid,
    src: `https://www.bbc.co.uk/programmes/${pid}/player`,
    url,
    ratio: programmesPlayerRatio,
  }
}

// The retired news player names its clip in `externalIdentifier` and its article in
// `embedPageUrl`, `/news/{slug}-{article}`, and states its poster in `holdingImage`.
const readNewsFlash = (element: Element | undefined): EmbedResolverResult | undefined => {
  const pid = flashVar(element, 'externalIdentifier')
  const page = parseUrlOnHosts(flashVar(element, 'embedPageUrl'), bbcHosts)
  const article = page?.pathname.match(newsPagePathRegex)?.groups?.article

  if (!isPidSlot(pid) || !article) {
    return
  }

  const holdingImage = flashVar(element, 'holdingImage')

  return {
    ...composeNewsEmbed(article, pid),
    thumbnail: parseUrlOnHosts(holdingImage, bbcImageHosts) ? holdingImage : undefined,
  }
}

// BBC's news, World Service and programmes clip players, pasted in a portrait box that pads them,
// and the retired Flash player. A news page needs its section slug, which the embed does not
// carry, and a current programmes clip such as `p08s3bnj` has no page of its own.
export const bbcResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, bbcHosts)

  if (!parsed) {
    return
  }

  // The retired Flash player names its clip in the `playlist` flashvar, as
  // `/iplayer/playlist/{pid}` or `/comedy/forge-assets/extra/playlist/{pid}.xml`. News and World
  // Service playlists carry no pid, and the news player names it in other flashvars.
  if (flashFileRegex.test(parsed.pathname)) {
    const playlist = parseUrlOnHosts(flashVar(element, 'playlist'), bbcHosts)
    const pid = playlist?.pathname.match(playlistPathRegex)?.[1]

    if (isPid(pid)) {
      return composeProgrammesEmbed(pid, `https://www.bbc.co.uk/programmes/${pid}`)
    }

    return readNewsFlash(element)
  }

  const segments = getPathSegments(parsed)
  const [first, second, third, fourth, fifth] = segments

  // `/news/av/embed/{pid}/{article}` 301s to `/news/av-embeds/{article}/vpid/{pid}`, and the
  // player answers 404 when either the pid or the article is fabricated.
  if (first === 'news' && second === 'av' && third === 'embed' && isPidSlot(fourth)) {
    return isArticleId(fifth) ? composeNewsEmbed(fifth, fourth) : undefined
  }

  if (first === 'news' && second === 'av-embeds' && isArticleId(third) && fourth === 'vpid') {
    return isPidSlot(fifth) ? composeNewsEmbed(third, fifth) : undefined
  }

  // `/ws/av-embeds/articles/{article}/{pid}/{lang}/` is the same player app as the news one.
  if (first === 'ws' && second === 'av-embeds') {
    const pid = segments.find(isPid)

    if (!pid) {
      return
    }

    return {
      provider: 'bbc',
      id: pid,
      src: `https://www.bbc.com${parsed.pathname}`,
      ratio: newsPlayerRatio,
    }
  }

  if (first === 'programmes' && isPidSlot(second) && third === 'player') {
    return composeProgrammesEmbed(second)
  }
}

export const bbcIframeEmbedResolver = createUrlEmbedResolver(bbcHosts, bbcResolveEmbed)
