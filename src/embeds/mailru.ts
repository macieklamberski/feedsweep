import { parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'mailru'
const playerRatio = '16/9'

// `my.mail.ru` serves the player, `api.video.mail.ru` was the host of the older embed and no
// longer resolves, and `img.mail.ru` served the Flash player.
const mailruHosts = ['my.mail.ru', 'api.video.mail.ru', 'img.mail.ru']

const numericPathRegex = /^\/video\/embed\/([^/]+)\/?$/
// api.video.mail.ru/videos/embed/{type}/{user}/{album}/{n}.html is dead, and the same path on
// videoapi.my.mail.ru 301s to my.mail.ru/{type}/{user}/video/embed/{album}/{n}.
const legacyPathRegex = /^\/videos\/embed\/(.+)\.html$/
const modernPathRegex = /^\/([^/]+)\/([^/]+)\/video\/embed\/([^/]+)\/([^/]+)\/?$/
// {type}/{user}/{album}/{counter}.
const subjectRegex = /^([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/
const flashPlayerPathRegex = /^\/r\/video2?\/\w+\.swf$/
// The older Flash players took `par={host}/{type}/{user}/{album}/${counter}$0${duration}`.
const flashParPathRegex = /^\/([^/]+\/[^/]+\/[^/]+)\/\$([^$/]+)\$[^/]*$/

const composeNumeric = (videoId: string): EmbedResolverResult => {
  return {
    provider,
    id: videoId,
    src: `https://my.mail.ru/video/embed/${videoId}`,
    ratio: playerRatio,
  }
}

const composeSubject = (subject: string): EmbedResolverResult | undefined => {
  const match = subject.match(subjectRegex)

  if (!match) {
    return
  }

  const [, type, user, album, counter] = match

  return {
    provider,
    // my.mail.ru/+/video/meta/{type}/{user}/{n} answers with the title, the poster and the duration
    // for a real video and 404 for an invented one.
    id: `${type}/${user}/${album}/${counter}`,
    src: `https://my.mail.ru/${type}/${user}/video/embed/${album}/${counter}`,
    url: `https://my.mail.ru/${type}/${user}/video/${album}/${counter}.html`,
    ratio: playerRatio,
    author: user,
  }
}

const resolveTarget = (url: string, element?: Element): EmbedResolverResult | undefined => {
  const parsed = parseUrlOnHosts(url, mailruHosts)

  if (!parsed) {
    return
  }

  if (parsed.hostname === 'img.mail.ru') {
    if (!flashPlayerPathRegex.test(parsed.pathname)) {
      return
    }

    const movieSrc = parsed.searchParams.get('movieSrc') ?? flashVar(element, 'movieSrc')

    if (movieSrc) {
      return composeSubject(movieSrc)
    }

    const parPath = parseUrl(parsed.searchParams.get('par') ?? '', placeholderBaseUrl)?.pathname
    const par = parPath?.match(flashParPathRegex)

    return par ? composeSubject(`${par[1]}/${par[2]}`) : undefined
  }

  const videoId = parsed.pathname.match(numericPathRegex)?.[1]

  if (videoId) {
    return composeNumeric(videoId)
  }

  const legacySubject = parsed.pathname.match(legacyPathRegex)?.[1]

  if (legacySubject) {
    return composeSubject(legacySubject)
  }

  const modern = parsed.pathname.match(modernPathRegex)

  return modern ? composeSubject(modern.slice(1).join('/')) : undefined
}

export const mailruResolveEmbed: ResolveEmbed = (url, element) => {
  const target = resolveTarget(url, element)

  return target && { ...target, title: attr(element, 'title') }
}

// A Mail.ru video: the my.mail.ru iframe, the dead api.video.mail.ru embed or the Flash player.
export const mailruEmbedResolver = createUrlEmbedResolver(mailruHosts, mailruResolveEmbed)

export const mailruRenderHint: EmbedRenderHint = {
  provider,
  // The player reads autoplay off its flashVars for truth, and refuses the start on a mobile user
  // agent whatever the value says.
  autoplayParams: { autoplay: '1' },
}
