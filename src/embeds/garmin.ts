import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'garmin'

const sizes = {
  player: { height: 548 },
}

const hosts = ['connect.garmin.com']

// The spellings publishers pasted. Garmin chains them onto `embed/activity/{id}`, which is what
// the mint takes, and that route 404s for an activity that does not exist.
const activityEmbedRegex =
  /^\/(?:(?:modern|app)\/)?(?:activity\/embed|embed\/activity)\/([^/]+)\/?$/i

// Garmin Connect's activity embed, an interactive map and stats panel for one recorded activity.
export const garminResolveEmbed: ResolveUrlEmbed = (url) => {
  const activityId = url.pathname.match(activityEmbedRegex)?.[1]

  if (!activityId) {
    return
  }

  return {
    provider,
    id: activityId,
    src: `https://connect.garmin.com/embed/activity/${activityId}`,
    url: `https://connect.garmin.com/app/activity/${activityId}`,
    ...sizes.player,
  }
}

export const garminEmbedResolver = createUrlEmbedResolver(hosts, garminResolveEmbed)
