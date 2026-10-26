import { composeQuery, getQueryParam, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'voki'

const flashHosts = ['vhss-a.oddcast.com', 'vhss-d.oddcast.com']
const hosts = ['www.voki.com']

const flashPlayerPathRegex = /^\/vhss_editors\/voki_player\.swf$/i
const pickupPathRegex = /^\/site\/pickup\/?$/i

// The pickup page sizes the player to its window less 280 pixels of site chrome, so this frame
// gives the scene the 267-pixel height of Voki's own default embed at any width.
const sizes = {
  player: { height: 547 },
}

// Voki's share page, the one frameable player, which builds the HTML5 player for the scene.
export const composePlayerUrl = (sc: string, chsm: string): string => {
  return `https://www.voki.com/site/pickup${composeQuery({ scid: sc, chsm })}`
}

const composeEmbed = (sc: string, chsm: string): EmbedResolverResult => {
  const src = composePlayerUrl(sc, chsm)

  return {
    provider,
    id: `${sc}/${chsm}`,
    src,
    url: src,
    ...sizes.player,
  }
}

const vokiFlashResolveEmbed: ResolveUrlEmbed = (url) => {
  if (!flashPlayerPathRegex.test(url.pathname)) {
    return
  }

  // The scene url ends in `getvoki/chsm={chsm}&sc={sc}`, its `&` kept as `%26` inside `doc`.
  const [route, scene] = getQueryParam(url.searchParams, 'doc')?.split('/').slice(-2) ?? []
  const params = new URLSearchParams(scene)
  const sc = getQueryParam(params, 'sc')
  const chsm = getQueryParam(params, 'chsm')

  if (!isAnyOf(route, 'getvoki') || !sc || !chsm) {
    return
  }

  return composeEmbed(sc, chsm)
}

// Voki's retired Flash player, `vhss-d.oddcast.com/vhss_editors/voki_player.swf?doc=…` or the same
// path on `vhss-a.oddcast.com`, in an `<embed>` or an `<object>`, which renders nothing and names
// the scene in its `doc` url.
export const vokiFlashEmbedResolver = createUrlEmbedResolver(flashHosts, vokiFlashResolveEmbed)

const vokiResolveEmbed: ResolveUrlEmbed = (url) => {
  if (!pickupPathRegex.test(url.pathname)) {
    return
  }

  const sc = getQueryParam(url.searchParams, 'scid')
  const chsm = getQueryParam(url.searchParams, 'chsm')

  if (!sc || !chsm) {
    return
  }

  return composeEmbed(sc, chsm)
}

// The share page `www.voki.com/site/pickup?scid={sc}&chsm={chsm}` in a frame, which
// `rebuildVokiEmbeds` writes for the script embed.
export const vokiIframeEmbedResolver = createUrlEmbedResolver(hosts, vokiResolveEmbed)
