import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'garmin'

const garminHosts = ['connect.garmin.com']

// The spellings publishers pasted. Garmin chains them onto `embed/activity/{id}`, which is what
// the mint takes, and that route 404s for an activity that does not exist.
const activityEmbedRegex = /^\/+(?:(?:modern|app)\/)?(?:activity\/embed|embed\/activity)\/(\d+)\/?$/

// Garmin Connect's activity embed, an interactive map and stats panel for one recorded activity.
export const garminResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, garminHosts)
  const activityId = parsed?.pathname.match(activityEmbedRegex)?.[1]

  if (!activityId) {
    return
  }

  return {
    provider,
    id: activityId,
    src: `https://connect.garmin.com/embed/activity/${activityId}`,
    url: `https://connect.garmin.com/app/activity/${activityId}`,
  }
}

export const garminEmbedResolver = createUrlEmbedResolver(garminHosts, garminResolveEmbed)
