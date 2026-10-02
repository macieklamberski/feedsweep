import type { FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'dailymail'

// Each edition's host serves the same player and 301s onto the reader's own edition.
const dailymailHosts = ['dailymail.co.uk', 'dailymail.com']

// The server matches the path in its own case only.
const playerPathRegex = /^\/embed\/video\/([^/]+)\.html$/

// The player is 175 pixels of fixed chrome plus a 16:9 video, so its height is 175 plus 9/16 of
// the width. The ratio matches it at a 320 pixel frame and errs tall above that.
const playerRatio = '9/10'

// MailOnline's video player, `/embed/video/{id}.html`.
export const dailymailResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, dailymailHosts)

  if (!parsed) {
    return
  }

  const id = parsed.pathname.match(playerPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://${parsed.hostname}/embed/video/${id}.html`,
    url: `https://${parsed.hostname}/video/video-${id}.html`,
    ratio: playerRatio,
    title: attr(element, 'title'),
  }
}

export const dailymailEmbedResolver = createUrlEmbedResolver(dailymailHosts, dailymailResolveEmbed)

export const dailymailFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'MailOnline Embed Player' },
]
