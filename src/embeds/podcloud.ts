import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readIframeResizeHeight } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'podcloud'

// A show's own site is a subdomain, and it answers 404 to the player's path.
const podcloudHost = 'podcloud.fr'

// The two player options that pick what plays: `guid:{item}` loads that item in place of the
// page's, and `playlist:{user}-{id}` loads a playlist in place of both. The rest only change
// the display.
const contentOptions = ['guid', 'playlist']

// The options the player reads from the segments after `player`, each split on `;` and named
// by the part before `:`.
const readContentOptions = (segments: Array<string>): Array<string> => {
  return segments
    .flatMap((segment) => segment.split(';'))
    .filter((option) => contentOptions.includes(option.split(':')[0]))
}

// The player's url and page, as the episode page's og:video and og:url write them. A show with
// no episode named plays its latest one with the episode list beside it.
const composeEmbed = (
  show: string,
  episode?: string,
  options: Array<string> = [],
  title?: string,
): EmbedResolverResult => {
  const page = episode
    ? `https://podcloud.fr/podcast/${show}/episode/${episode}`
    : `https://podcloud.fr/podcast/${show}`
  const src = [`${page}/player`, ...options].join('/')

  // With a content option the page names another item, so the key is the option the player
  // queries by: `podcastItem(_id)` for a guid, `playlist(user_id, _id)` for a playlist, which
  // wins over a guid.
  const option = options.find((value) => value.startsWith('playlist:')) ?? options[0]

  if (option) {
    return {
      provider,
      id: option,
      src,
      title,
    }
  }

  return {
    provider,
    id: episode ? `${show}/${episode}` : show,
    src,
    url: page,
    title,
  }
}

// podCloud's player, podcloud.fr/podcast/{show}[/episode/{episode}]/player[/{options}]. The
// player reads every segment after `player` as an option. `guid:` and `playlist:` pick what
// plays and are kept, and the rest, such as `fixed-size` or `list:opened`, are display options
// and are dropped. The `title` its embed dialog writes is the show's or the episode's name.
export const podcloudResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, podcloudHost)

  if (!parsed || parsed.hostname !== podcloudHost) {
    return
  }

  const segments = getPathSegments(parsed)
  const [route, show, kind, episode, player] = segments

  if (route !== 'podcast') {
    return
  }

  const title = attr(element, 'title')

  if (kind === 'player') {
    return composeEmbed(show, undefined, readContentOptions(segments.slice(3)), title)
  }

  if (kind === 'episode' && player === 'player') {
    return composeEmbed(show, episode, readContentOptions(segments.slice(5)), title)
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
// turns the message off, and the minted url drops it.
export const podcloudRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://podcloud.fr',
  readHeight: readIframeResizeHeight,
}
