import { getPathSegments, isHostOf, type Nullish, toMap } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { flashVars } from '../utils/dom.js'
import {
  encodePathSegment,
  parseUrlOnHosts,
  pickQueryParams,
  pickUrlParams,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pbs'

const playerHost = 'player.pbs.org'

// The retired player host, which redirects to the player host on the same path.
const legacyPlayerHost = 'video.pbs.org'

// The retired Flash player's host, which also serves files.
const flashHost = 'www-tc.pbs.org'

const flashPlayerPath = '/video/media/swf/PBSPlayer.swf'

const pbsHosts = [playerHost, legacyPlayerHost, flashHost]

// The route a carrier names, against the id space it belongs to. `viralplayer` and
// `widget/partnerplayer` serve each other's numeric ids; `partnerplayer` takes a base64url slug
// and answers an error shell for a numeric one.
const idSpaces = toMap({
  viralplayer: 'viralplayer',
  'widget/partnerplayer': 'viralplayer',
  partnerplayer: 'partnerplayer',
})

// The parameters the player reads besides the id: the clip bounds and chapter, and the layout.
// `autoplay` and `muted` are the reader's to set.
const playerParams = ['start', 'end', 'chapter', 'h', 'topbar', 'endscreen', 'previewLayout']

// Settings the publisher chose for this one embed, which a reader may override.
const publisherParams = [
  'unsafeDisableUpsellHref',
  'unsafeDisableSponsorship',
  'unsafeDisableContinuousPlay',
]

// A 16:9 video above a control bar of fixed height, so the ratio errs tall at narrow widths.
const playerRatio = '13/9'

// The route qualifies the id, since a numeric id also fits the slug alphabet and an id alone
// addresses neither space.
const composeEmbed = (
  route: string,
  videoId: Nullish<string>,
  query = '',
  params?: Record<string, string>,
): EmbedResolverResult | undefined => {
  const idSpace = idSpaces.get(route)

  if (!videoId || !idSpace) {
    return
  }

  return {
    provider,
    id: `${idSpace}/${videoId}`,
    src: `https://${playerHost}/${route}/${videoId}/${query}`,
    params,
    ratio: playerRatio,
  }
}

// The Flash player names the numeric id in its `video` flashvar, which the viral player serves.
// Every carrier writes `player=viral`, so no other player is known to map onto it.
const readFlashCarrier = (url: URL, element?: Element): EmbedResolverResult | undefined => {
  const params = new URLSearchParams(flashVars(element))

  if (url.pathname !== flashPlayerPath || params.get('player') !== 'viral') {
    return
  }

  const videoId = params.get('video')

  // The flashvar comes out decoded, and it goes into a path beside the raw path spelling.
  return composeEmbed('viralplayer', videoId ? encodePathSegment(videoId) : undefined)
}

// PBS's offsite player, which renders on its own but names no page and no poster.
export const pbsResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, pbsHosts)

  if (!parsed) {
    return
  }

  if (isHostOf(parsed, flashHost)) {
    return readFlashCarrier(parsed, element)
  }

  const segments = getPathSegments(parsed)
  const route = segments.slice(0, -1).join('/')

  // The retired host served the viral route alone.
  if (isHostOf(parsed, legacyPlayerHost) && route !== 'viralplayer') {
    return
  }

  const query = pickUrlParams(url, playerParams)
  const params = pickQueryParams(parsed.search, publisherParams)

  return composeEmbed(route, segments.at(-1), query, params)
}

export const pbsIframeEmbedResolver = createUrlEmbedResolver([playerHost], pbsResolveEmbed)

// The retired host's box was sized for the retired player, not the viral player it redirects to.
export const pbsLegacyIframeEmbedResolver = createUrlEmbedResolver(
  [legacyPlayerHost],
  pbsResolveEmbed,
  { preferResolverSize: true },
)

// The Flash box was sized for the retired player, not the viral player it now loads.
export const pbsFlashEmbedResolver = createUrlEmbedResolver([flashHost], pbsResolveEmbed, {
  preferResolverSize: true,
})

export const pbsRenderHint: EmbedRenderHint = {
  provider,
  // The player reads `autoplay` as true for the string `true` alone, so `autoplay=1` stays paused.
  autoplayParams: { autoplay: 'true' },
}
