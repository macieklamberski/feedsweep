import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'channel9'

const channel9Hosts = ['channel9.msdn.com']

const embedUrl =
  'https://learn.microsoft.com/_themes/docs.theme/master/en-us/_themes/global/video-embed-one-stream.html'

// Channel 9 is retired and cannot mint a new section.
const episodeSections = ['shows', 'blogs', 'series']

// A name carrying `&` or `=` would add its own parameter to the minted query.
const queryUnsafeRegex = /[&=]/

const channel9ResolveEmbed: ResolveEmbed = (url) => {
  const segments = getPathSegments(url)
  const section = segments.at(0)
  const route = segments.at(-1)

  if (!isAnyOf(route, 'player')) {
    return
  }

  // Channel 9's first redirect only lowercases the names, so a `+` stays a `+` in the query.
  const names = segments.slice(1, -1).map((name) => name.toLowerCase())

  if (names.some((name) => queryUnsafeRegex.test(name))) {
    return
  }

  if (isAnyOf(section, episodeSections) && names.length === 2) {
    const [show, episode] = names

    // Learn serves an episode page in every locale, so there is no one `url` to mint.
    return {
      provider,
      id: `${show}/${episode}`,
      src: `${embedUrl}?show=${show}&ep=${episode}`,
    }
  }

  if (isAnyOf(section, 'events') && names.length === 3) {
    const [event, edition, session] = names

    // Learn serves no page for an event session, so there is no `url` to mint.
    return {
      provider,
      id: `events/${event}-${edition}/${session}`,
      src: `${embedUrl}?ev=${event}-${edition}&session=${session}`,
    }
  }
}

// Channel 9's player iframe renders a blank blocked frame: every hop of its redirect chain to
// Microsoft Learn carries `x-frame-options: SAMEORIGIN`, while the embed page it ends on carries
// neither that nor a `frame-ancestors` list.
export const channel9EmbedResolver = createUrlEmbedResolver(channel9Hosts, channel9ResolveEmbed)
