import { isHostOrSubdomainOf, toMap } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'srgplay'

// SRG SSR's business units and the host each unit's player answers on. `tp.srgssr.ch/p/{unit}/
// embed` 301s onto `www.{host}/play/embed`. SWI is left out: its player redirects to an article
// whatever the urn, so a minted swissinfo.ch url plays nothing.
const playerHosts = toMap({
  srf: 'srf.ch',
  rts: 'rts.ch',
  rsi: 'rsi.ch',
  rtr: 'rtr.ch',
})

const srgplayHosts = ['srgssr.ch', ...playerHosts.values()]
const srgplayEmbedParams = ['startTime', 'subdivisions']

// The urn is written into a composed url, so one holding a separator or a query would let a feed
// choose the path. Its segment count varies: the corpus carries `urn:srf:ais:video:` beside
// `urn:srf:video:`, so it is kept as the source wrote it.
const safeUrnRegex = /^urn:([a-z]+):[a-z0-9:-]+$/

// The shared player, and the same player on each unit's own host.
const urnPlayerPathRegex = /^\/(?:p\/[^/]+\/embed|play\/embed)\/?$/

// The page players, which name a media id in `id`: the retired per-show `videoembed` answers 404,
// and `popupvideoplayer` is a live page that renders the same player as `/play/embed`.
const pagePlayerPathRegex =
  /^\/(?:player\/tv\/[^/]+\/videoembed\/[^/]+|play\/tv\/popupvideoplayer)$/

const readBusinessUnit = (parsed: URL): string | undefined => {
  for (const [unit, host] of playerHosts) {
    if (isHostOrSubdomainOf(parsed, host)) {
      return unit
    }
  }
}

const composeEmbed = (urn: string | null, search: string): EmbedResolverResult | undefined => {
  const unit = urn?.match(safeUrnRegex)?.[1]
  const host = unit && playerHosts.get(unit)

  if (!urn || !host) {
    return
  }

  // `/play/tv/-/video/-` redirects onto the slugged page and answers 404 for a urn naming nothing.
  // The route spells the medium, so an audio urn needs one this platform has not been measured on.
  const page = urn.includes(':video:')
    ? `https://www.${host}/play/tv/-/video/-?urn=${urn}`
    : undefined
  const src = `https://www.${host}/play/embed?urn=${urn}`
  const carried = new URLSearchParams(pickQueryParams(search, srgplayEmbedParams)).toString()

  return {
    provider,
    id: urn,
    src: carried ? `${src}&${carried}` : src,
    url: page,
  }
}

const srgplayResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, srgplayHosts)

  if (!parsed) {
    return
  }

  if (urnPlayerPathRegex.test(parsed.pathname)) {
    return composeEmbed(parsed.searchParams.get('urn'), parsed.search)
  }

  if (pagePlayerPathRegex.test(parsed.pathname)) {
    const mediaId = parsed.searchParams.get('id')

    if (!mediaId) {
      return
    }

    // The shared host names no business unit, so its urn names none either and has no host.
    return composeEmbed(`urn:${readBusinessUnit(parsed)}:video:${mediaId}`, parsed.search)
  }
}

// SRG SSR's shared player, serving SRF, RTS, RSI and RTR. The retired per-show player is
// dead markup whose own `id` still plays on the current one, and `rts.ch/embed/{code}` is a short
// code in an id space only the platform's own 301 can read, so it keeps the generic placeholder.
export const srgplayEmbedResolver = createUrlEmbedResolver(srgplayHosts, srgplayResolveEmbed)
