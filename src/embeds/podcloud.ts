import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readIframeResizeHeight } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'podcloud'

// A show's own site is a subdomain, and it answers 404 to the player's path.
const podcloudHost = 'podcloud.fr'

// The player's url and page, as the episode page's og:video and og:url write them. A show with
// no episode named plays its latest one with the episode list beside it.
const composeEmbed = (show: string, episode?: string, title?: string): EmbedResolverResult => {
  const page = episode
    ? `https://podcloud.fr/podcast/${show}/episode/${episode}`
    : `https://podcloud.fr/podcast/${show}`

  return {
    provider,
    id: episode ? `${show}/${episode}` : show,
    src: `${page}/player`,
    url: page,
    title,
  }
}

// podCloud's player, podcloud.fr/podcast/{show}[/episode/{episode}]/player[/{options}]. The
// player reads every segment after `player` as a display option, such as `fixed-size` or
// `list:opened`. The `title` its embed dialog writes is the show's or the episode's name.
export const podcloudResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, podcloudHost)

  if (!parsed || parsed.hostname !== podcloudHost) {
    return
  }

  const [route, show, kind, episode, player] = getPathSegments(parsed)

  if (route !== 'podcast') {
    return
  }

  const title = attr(element, 'title')

  if (kind === 'player') {
    return composeEmbed(show, undefined, title)
  }

  if (kind === 'episode' && player === 'player') {
    return composeEmbed(show, episode, title)
  }
}

export const podcloudIframeEmbedResolver = createUrlEmbedResolver(
  [podcloudHost],
  podcloudResolveEmbed,
)

// The div podCloud's older platform.js turns into the player, naming the show and the episode.
export const podcloudWidgetEmbedResolver = createMarkupEmbedResolver(
  'div[data-podcloud="player"][data-feed][data-item]',
  (element) => {
    const show = attr(element, 'data-feed')
    const episode = attr(element, 'data-item')

    if (!show || !episode) {
      return
    }

    return composeEmbed(show, episode)
  },
)

// The player posts its rendered height unasked, again on each resize. Its `/fixed-size` option
// turns the message off, and the minted url carries no option.
export const podcloudRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://podcloud.fr',
  readHeight: readIframeResizeHeight,
}
