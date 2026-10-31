import type { EmbedRenderHint, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'iheart'

const hosts = ['iheart.com']

// A route segment is the bare id or a slug hanging before it, `{slug}-{id}`.
const episodePathRegex =
  /^\/podcast\/(?:[^/]*-)?(?<showId>\d+)\/episode\/(?:[^/]*-)?(?<episodeId>\d+)\/?$/i
const showPathRegex = /^\/podcast\/(?:[^/]*-)?(\d+)\/?$/i
const stationPathRegex = /^\/(?<kind>live|artist)\/(?:[^/]*-)?(?<id>\d+)\/?$/i

// The episode player fills its frame and switches to a compact bar, drawn whole at 120 tall. The
// show and station players keep the 300 and 200 their embed code writes.
const sizes = {
  episode: { height: 120 },
  show: { height: 300 },
  station: { height: 200 },
}

const composePlayerEmbed = (
  id: string,
  page: string,
  size: { height: number },
  element?: Element,
): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `${page}?embed=true`,
    url: page,
    ...size,
    title: attr(element, 'title'),
  }
}

// An iHeart podcast player, of one episode or of a show, and the live station and artist radio
// players, on www.iheart.com or beta.iheart.com.
export const iheartResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const pathname = url.pathname
  const episode = pathname.match(episodePathRegex)?.groups

  if (episode) {
    const page = `https://www.iheart.com/podcast/${episode.showId}/episode/${episode.episodeId}/`

    const id = `${episode.showId}/${episode.episodeId}`

    return composePlayerEmbed(id, page, sizes.episode, element)
  }

  const station = pathname.match(stationPathRegex)?.groups

  if (station?.kind && station.id) {
    const page = `https://www.iheart.com/${station.kind}/${station.id}/`

    return composePlayerEmbed(`${station.kind}/${station.id}`, page, sizes.station, element)
  }

  const show = pathname.match(showPathRegex)

  if (!show) {
    return
  }

  const page = `https://www.iheart.com/podcast/${show[1]}/`

  return composePlayerEmbed(show[1], page, sizes.show, element)
}

export const iheartEmbedResolver = createUrlEmbedResolver(hosts, iheartResolveEmbed)

export const iheartRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
