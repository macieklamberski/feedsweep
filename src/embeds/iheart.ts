import { parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'iheart'

const iheartHosts = ['iheart.com']

// A route segment is the bare id or a slug hanging before it, `{slug}-{id}`.
const episodePathRegex = /^\/podcast\/(?:[^/]*-)?(\d+)\/episode\/(?:[^/]*-)?(\d+)\/?$/i
const showPathRegex = /^\/podcast\/(?:[^/]*-)?(\d+)\/?$/i

// The player's own embed code sizes the episode bar and the show player differently.
const playerHeights = { episode: 200, show: 300 }

// An iHeart podcast player, of one episode or of a show, on www.iheart.com or beta.iheart.com.
export const iheartResolveEmbed: ResolveEmbed = (url, element) => {
  const pathname = parseUrl(url, placeholderBaseUrl)?.pathname ?? ''
  const episode = pathname.match(episodePathRegex)

  if (episode) {
    const page = `https://www.iheart.com/podcast/${episode[1]}/episode/${episode[2]}/`

    return {
      provider,
      id: `${episode[1]}/${episode[2]}`,
      src: `${page}?embed=true`,
      url: page,
      height: playerHeights.episode,
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
    height: playerHeights.show,
    title: attr(element, 'title'),
  }
}

export const iheartEmbedResolver = createUrlEmbedResolver(iheartHosts, iheartResolveEmbed)

export const iheartRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://www.iheart.com',
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
