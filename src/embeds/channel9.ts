import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'channel9'

const channel9Hosts = ['channel9.msdn.com']

// Channel 9 is retired and cannot mint a new section. `Events` is left out: its player rewrites
// to `ev={show}-{year}&session={id}`, which the `show`/`ep` mint below cannot compose.
const episodeSections = ['shows', 'blogs', 'series', 'posts']

// A show or episode name carrying `&` or `=` would add its own parameter to the minted query.
const queryUnsafeRegex = /[&=]/

type Episode = { show: string; episode: string }

const readEpisode = (url: string): Episode | undefined => {
  const segments = getPathSegments(url)

  if (segments.length !== 4) {
    return
  }

  const [section, show, episode, route] = segments

  if (route.toLowerCase() !== 'player' || !isAnyOf(section, episodeSections)) {
    return
  }

  if (queryUnsafeRegex.test(show) || queryUnsafeRegex.test(episode)) {
    return
  }

  return { show: show.toLowerCase(), episode: episode.toLowerCase() }
}

// Microsoft's own rewrite only lowercases the two names, so `Shows/Going+Deep` arrives as
// `show=going+deep` with the `+` intact. Normalising the `+` away stops matching the server.
const composeEmbed = ({ show, episode }: Episode): EmbedResolverResult => {
  const embedPath = '_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html'

  return {
    provider,
    id: `${show}/${episode}`,
    src: `https://learn.microsoft.com/${embedPath}?show=${show}&ep=${episode}`,
    url: `https://learn.microsoft.com/en-us/shows/${show}/${episode}`,
  }
}

const channel9ResolveEmbed: ResolveEmbed = (url) => {
  const episode = readEpisode(url)

  return episode && composeEmbed(episode)
}

// Channel 9's player iframe renders a blank blocked frame: every hop of its redirect chain to
// Microsoft Learn carries `x-frame-options: SAMEORIGIN`, while the embed page it ends on carries
// neither that nor a `frame-ancestors` list.
export const channel9EmbedResolver = createUrlEmbedResolver(channel9Hosts, channel9ResolveEmbed)
