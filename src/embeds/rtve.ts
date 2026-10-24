import { getAnyOf, getPathSegments, getQueryParam, isAnyOf, parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'rtve'

// `irtve.es` is the older spelling of the same broadcaster's asset domain and carries the
// Flash player under the same path.
const rtveHosts = ['rtve.es', 'irtve.es']

type Kind = 'audio' | 'video'

const kinds: Array<Kind> = ['audio', 'video']

// The asset is {id}_{locale}_{audios|videos}, in the swf query or path on v2 and the flashvars
// on 4.x. The locale says nothing about the asset.
const flashAssetRegex = /^([^_]+)_[^_]+_(audios|videos)$/i

const flashPlayerPathRegex = /^\/swf\/.*\.swf$/i
const flashEmbedPathRegex = /^\/swf\/v2\/embed\/([^/]+)\/RTVEPlayer\.swf$/i
const flvPlayerPathRegex = /^\/swf\/FLVPlayer\.swf$/i
const nielsenAssetRegex = /(?:^|,)assetID::([^,]+)/i
const nielsenTitleRegex = /(?:^|,)title::(.+)$/i
const audioConfigRegex = /\/rtve_config_audio_embed\.xml$/i

// The player fills whatever box it gets, and the Flash video carriers state 425 by 239, 16:9.
const playerRatio = '16/9'

// Audio and video are two id spaces with one grammar, and rtve.es/api/{videos|audios}/{id}.json
// needs the kind. The page and the poster share the kind's letter: img.rtve.es/v/{id}/ and
// img.rtve.es/a/{id}/.
const composeEmbed = (kind: Kind, id: string): EmbedResolverResult => {
  const letter = kind === 'video' ? 'v' : 'a'

  return {
    provider,
    id: `${kind}/${id}`,
    src: `https://www.rtve.es/drmn/embed/${kind}/${id}/`,
    url: `https://www.rtve.es/${letter}/${id}/`,
    thumbnail: `https://img.rtve.es/${letter}/${id}/`,
    ratio: playerRatio,
  }
}

export const rtveResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, rtveHosts)

  if (!parsed) {
    return
  }

  const [drmn, embed, route, id] = getPathSegments(parsed)
  const kind = getAnyOf(route, kinds)

  if (!isAnyOf(drmn, 'drmn') || !isAnyOf(embed, 'embed') || !kind) {
    return
  }

  if (!id) {
    return
  }

  // RTVE's snippet writes the title into name, not title.
  const title = attr(element, 'title') ?? attr(element, 'name')

  return { ...composeEmbed(kind, id), title }
}

// RTVE's player iframe, rtve.es/drmn/embed/{audio|video}/{id}/.
export const rtveIframeEmbedResolver = createUrlEmbedResolver(rtveHosts, rtveResolveEmbed)

const rtveFlashResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !flashPlayerPathRegex.test(parsed.pathname)) {
    return
  }

  // The FLVPlayer names its asset only in the nielsen beacon, assetID::{id},title::{title}, and
  // says the asset is audio only through its config file.
  if (flvPlayerPathRegex.test(parsed.pathname)) {
    const config = getQueryParam(parsed.searchParams, 'config') ?? flashVar(element, 'config')
    const nielsen = getQueryParam(parsed.searchParams, 'nielsen') ?? flashVar(element, 'nielsen')
    const id = nielsen?.match(nielsenAssetRegex)?.[1]

    if (!config || !audioConfigRegex.test(config) || !id) {
      return
    }

    return { ...composeEmbed('audio', id), title: nielsen?.match(nielsenTitleRegex)?.[1] }
  }

  const asset =
    getQueryParam(parsed.searchParams, 'assetID') ??
    flashVar(element, 'assetID') ??
    parsed.pathname.match(flashEmbedPathRegex)?.[1]
  const match = asset?.match(flashAssetRegex)

  if (!match) {
    return
  }

  // The 4.x snippet writes the asset's page link as the object's fallback, named after it.
  const title = element?.closest('object')?.querySelector(':scope > a')?.textContent?.trim()

  return { ...composeEmbed(isAnyOf(match[2], 'audios') ? 'audio' : 'video', match[1]), title }
}

// RTVE's retired Flash player under /swf/, which names its asset as {id}_es_{audios|videos}.
export const rtveFlashEmbedResolver = createUrlEmbedResolver(rtveHosts, rtveFlashResolveEmbed)

export const rtveRenderHint: EmbedRenderHint = {
  provider,
  // Compared as a string: autoplay=1 leaves the player's flag false.
  autoplayParams: { autoplay: 'true' },
}
