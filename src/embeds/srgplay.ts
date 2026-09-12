import { toMap } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { isOnHosts, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'srgplay'

// SRG SSR's business units and the host each unit's player answers on. `tp.srgssr.ch/p/{unit}/
// embed` 301s onto `www.{host}/play/embed`, and SWI's host is not named after its unit.
const playerHosts = toMap({
  srf: 'srf.ch',
  rts: 'rts.ch',
  rsi: 'rsi.ch',
  rtr: 'rtr.ch',
  swi: 'swissinfo.ch',
})

const srgplayHosts = ['srgssr.ch', ...playerHosts.values()]

// The urn is written into a composed url, so one holding a separator or a query would let a feed
// choose the path. Its segment count varies: the corpus carries `urn:srf:ais:video:` beside
// `urn:srf:video:`, so it is kept as the source wrote it rather than rebuilt from its parts.
const safeUrnRegex = /^urn:([a-z]+):[a-z0-9:-]+$/i
const videoUrnRegex = /:video:[a-z0-9-]+$/i

// The shared player, and the same player on each unit's own host.
const urnPlayerPathRegex = /^\/(?:p\/[^/]+\/embed|play\/embed)$/

// The retired page players, which name a live media id in `id`: the per-show `videoembed` answers
// 404, and `popupvideoplayer` opens a window the reader has no way to draw.
const retiredPlayerPathRegex =
  /^\/(?:player\/tv\/[^/]+\/videoembed\/[^/]+|play\/tv\/popupvideoplayer)$/

const readBusinessUnit = (parsed: URL): string | undefined => {
  for (const [unit, host] of playerHosts) {
    if (isOnHosts(parsed, host)) {
      return unit
    }
  }
}

const composeEmbed = (urn: string | null): EmbedResolverResult | undefined => {
  const unit = urn?.match(safeUrnRegex)?.[1].toLowerCase()
  const host = unit && playerHosts.get(unit)

  if (!urn || !host) {
    return
  }

  // `/play/tv/-/video/-` 301s onto the slugged page and answers 404 for a urn naming nothing. The
  // route spells the medium, so an audio urn needs one this platform has not been measured on.
  const page = videoUrnRegex.test(urn)
    ? `https://www.${host}/play/tv/-/video/-?urn=${urn}`
    : undefined

  return {
    provider,
    id: urn,
    src: `https://www.${host}/play/embed?urn=${urn}`,
    url: page,
  }
}

const srgplayResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, srgplayHosts)

  if (!parsed) {
    return
  }

  if (urnPlayerPathRegex.test(parsed.pathname)) {
    return composeEmbed(parsed.searchParams.get('urn'))
  }

  if (retiredPlayerPathRegex.test(parsed.pathname)) {
    const unit = readBusinessUnit(parsed)
    const mediaId = parsed.searchParams.get('id')

    if (!unit || !mediaId) {
      return
    }

    return composeEmbed(`urn:${unit}:video:${mediaId}`)
  }
}

// SRG SSR's shared player, serving SRF, RTS, RSI, RTR and SWI. The retired per-show player is
// dead markup whose own `id` still plays on the current one, and `rts.ch/embed/{code}` is a short
// code in an id space only the platform's own 301 can read, so it keeps the generic placeholder.
export const srgplayEmbedResolver = createUrlEmbedResolver(srgplayHosts, srgplayResolveEmbed)
