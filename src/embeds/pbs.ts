import { getPathSegments, isHostOf, type Nullish, toMap } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { flashVars } from '../utils/dom.js'
import {
  absoluteUrlRegex,
  encodePathSegment,
  parseUrlOnHosts,
  pickUrlParams,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pbs'

const playerHost = 'player.pbs.org'

// The retired player host, which redirects to the player host on the same path.
const legacyPlayerHost = 'video.pbs.org'

// Member stations' player hosts, which serve the player's routes and ids or redirect onto them.
const stationPlayerHosts = [
  'video.nhptv.org',
  'video.rmpbs.org',
  'video.unctv.org',
  'video.whyy.org',
  'video.wttw.com',
  'watch.weta.org',
]

// The retired Flash player's host, which also serves files.
const flashHost = 'www-tc.pbs.org'

// The CDN host that served the same Flash player.
const flashCdnHost = 'dgjigvacl6ipj.cloudfront.net'

const flashPlayerPaths = [
  '/video/media/swf/PBSPlayer.swf',
  '/s3/pbs.videoportal-prod.cdn/media/swf/PBSPlayer.swf',
  '/media/swf/PBSPlayer.swf',
]

const flashHosts = [flashHost, flashCdnHost]

const pbsHosts = [playerHost, legacyPlayerHost, ...stationPlayerHosts, ...flashHosts]

// The route a carrier names, against the id space it belongs to. `viralplayer` and
// `widget/partnerplayer` serve each other's numeric ids; `partnerplayer` takes a base64url slug
// and answers an error shell for a numeric one.
const idSpaces = toMap({
  viralplayer: 'viralplayer',
  'widget/partnerplayer': 'viralplayer',
  partnerplayer: 'partnerplayer',
})

// The route word of a portal url in the Flash player's `video` flashvar, against the player route
// that serves the id after it.
const flashPortalRoutes = toMap({
  videoPlayerInfo: 'viralplayer',
  videoinfo: 'partnerplayer',
})

// The clip bounds and the chapter, the playback parameters the player reads besides the id.
const playbackParams = ['start', 'end', 'chapter']

// A 16:9 video above a control bar of fixed height, so the ratio errs tall at narrow widths.
const playerRatio = '13/9'

// The route qualifies the id, since a numeric id also fits the slug alphabet and an id alone
// addresses neither space.
const composeEmbed = (
  route: string,
  videoId: Nullish<string>,
  query = '',
): EmbedResolverResult | undefined => {
  const idSpace = idSpaces.get(route)

  if (!videoId || !idSpace) {
    return
  }

  return {
    provider,
    id: `${idSpace}/${videoId}`,
    src: `https://${playerHost}/${route}/${videoId}/${query}`,
    ratio: playerRatio,
  }
}

// The Flash player names the video in its `video` flashvar, as the numeric id the viral player
// serves or as a station portal's url.
// Every carrier writes `player=viral`, so no other player is known to map onto it.
const readFlashCarrier = (url: URL, element?: Element): EmbedResolverResult | undefined => {
  const params = new URLSearchParams(flashVars(element))

  if (!flashPlayerPaths.includes(url.pathname) || params.get('player') !== 'viral') {
    return
  }

  const video = params.get('video')

  // A station portal's url holds the numeric id or the partner slug after its route word.
  if (video && absoluteUrlRegex.test(video)) {
    const [portalRoute = '', videoId] = getPathSegments(video)
    const route = flashPortalRoutes.get(portalRoute)

    return route ? composeEmbed(route, videoId) : undefined
  }

  // The flashvar comes out decoded, and it goes into a path beside the raw path spelling.
  return composeEmbed('viralplayer', video ? encodePathSegment(video) : undefined)
}

// PBS's offsite player, which renders on its own but names no page and no poster.
export const pbsResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, pbsHosts)

  if (!parsed) {
    return
  }

  if (isHostOf(parsed, flashHosts)) {
    return readFlashCarrier(parsed, element)
  }

  const segments = getPathSegments(parsed)
  const route = segments.slice(0, -1).join('/')

  // The retired host served the viral route alone.
  if (isHostOf(parsed, legacyPlayerHost) && route !== 'viralplayer') {
    return
  }

  return composeEmbed(route, segments.at(-1), pickUrlParams(url, playbackParams))
}

export const pbsIframeEmbedResolver = createUrlEmbedResolver([playerHost], pbsResolveEmbed)

export const pbsLegacyIframeEmbedResolver = createUrlEmbedResolver(
  [legacyPlayerHost],
  pbsResolveEmbed,
)

export const pbsStationIframeEmbedResolver = createUrlEmbedResolver(
  stationPlayerHosts,
  pbsResolveEmbed,
)

export const pbsFlashEmbedResolver = createUrlEmbedResolver(flashHosts, pbsResolveEmbed)

export const pbsRenderHint: EmbedRenderHint = {
  provider,
  // The player reads `autoplay` as true for the string `true` alone, so `autoplay=1` stays paused.
  autoplayParams: { autoplay: 'true' },
}
