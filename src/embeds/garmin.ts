import { isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'garmin'

const sizes = {
  player: { height: 548 },
}

const hosts = ['connect.garmin.com']

// The spellings publishers pasted. Garmin chains them onto `embed/{kind}/{id}`, which is what
// the mint takes, and that route 404s for an activity or a course that does not exist.
const embedRegex =
  /^\/(?:(?:modern|app)\/)?(?:(?<kind>activity|course)\/embed|embed\/(?<embedKind>activity|course))\/(?<id>[^/]+)\/?$/i

// Garmin Connect's embed of a recorded activity or a planned course, an interactive map and
// stats panel.
export const garminResolveEmbed: ResolveUrlEmbed = (url) => {
  const groups = url.pathname.match(embedRegex)?.groups
  const kind = groups?.kind ?? groups?.embedKind
  const id = groups?.id

  if (!kind || !id) {
    return
  }

  return {
    provider,
    // An activity keeps its bare id, and a course is qualified as its numbers are another space.
    id: isAnyOf(kind, 'course') ? `${kind}/${id}` : id,
    src: `https://connect.garmin.com/embed/${kind}/${id}`,
    url: `https://connect.garmin.com/app/${kind}/${id}`,
    ...sizes.player,
  }
}

export const garminEmbedResolver = createUrlEmbedResolver(hosts, garminResolveEmbed)
