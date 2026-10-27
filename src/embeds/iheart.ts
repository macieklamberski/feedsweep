import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
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

// An iHeart podcast player, of one episode or of a show, and the live station and artist radio
// players, on www.iheart.com or beta.iheart.com.
export const iheartResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const pathname = url.pathname
  const episode = pathname.match(episodePathRegex)?.groups

  if (episode) {
    const page = `https://www.iheart.com/podcast/${episode.showId}/episode/${episode.episodeId}/`

    return {
      provider,
      id: `${episode.showId}/${episode.episodeId}`,
      src: `${page}?embed=true`,
      url: page,
      ...sizes.episode,
      title: attr(element, 'title'),
    }
  }

  const station = pathname.match(stationPathRegex)?.groups

  if (station?.kind && station.id) {
    const page = `https://www.iheart.com/${station.kind}/${station.id}/`

    return {
      provider,
      id: `${station.kind}/${station.id}`,
      src: `${page}?embed=true`,
      url: page,
      ...sizes.station,
      title: attr(element, 'title'),
    }
  }

  const show = pathname.match(showPathRegex)

  if (!show) {
    return
  }

  const page = `https://www.iheart.com/podcast/${show[1]}/`

  return {
    provider,
    id: show[1],
    src: `${page}?embed=true`,
    url: page,
    ...sizes.show,
    title: attr(element, 'title'),
  }
}

export const iheartEmbedResolver = createUrlEmbedResolver(hosts, iheartResolveEmbed)

export const iheartRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
