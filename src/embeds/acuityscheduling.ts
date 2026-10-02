import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'acuityscheduling'

// The page host only, since `embed.acuityscheduling.com` serves the sizing script and the
// "Book now" button script, which opens the scheduler in an overlay.
const acuityschedulingHosts = ['app.acuityscheduling.com']

// Each picks what the scheduler offers: one appointment type or a category of them, one
// calendar, one location.
const schedulerParams = ['owner', 'appointmentType', 'calendarID', 'location']

const sizingMessageRegex = /^sizing:(\d+)$/

// The scheduler, `schedule.php?owner={id}`, as the embed code writes it. It redirects to a
// `/schedule/{hash}` path that only the server can derive from the owner.
export const acuityschedulingResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, acuityschedulingHosts)
  const owner = parsed?.searchParams.get('owner')

  if (parsed?.pathname !== '/schedule.php' || !owner) {
    return
  }

  // The embed code repeats `owner`, and the first one is kept.
  const query = pickUrlParams(parsed.href, schedulerParams)
  const appointmentType = parsed.searchParams.get('appointmentType')

  return {
    provider,
    id: appointmentType ? `${owner}/${appointmentType}` : owner,
    src: `https://app.acuityscheduling.com/schedule.php${query}`,
    url: `https://app.acuityscheduling.com/schedule.php${query}`,
  }
}

// Acuity Scheduling's inline scheduler iframe, sized by a script that feeds strip.
export const acuityschedulingEmbedResolver = createUrlEmbedResolver(
  acuityschedulingHosts,
  acuityschedulingResolveEmbed,
)

// The scheduler posts its rendered height unasked, as the string `sizing:{height}`, again on
// each step it changes to.
export const readAcuityschedulingHeight = (data: unknown): number | undefined => {
  if (typeof data !== 'string') {
    return
  }

  return readPixels(data.match(sizingMessageRegex)?.[1])
}

export const acuityschedulingRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://app.acuityscheduling.com',
  readHeight: readAcuityschedulingHeight,
}
