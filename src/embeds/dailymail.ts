import type { FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'dailymail'

// Each edition's host serves the same player and 301s onto the reader's own edition.
const dailymailHosts = ['dailymail.co.uk', 'dailymail.com']

// The server matches the path in its own case only.
const playerPathRegex = /^\/embed\/video\/([^/]+)\.html$/

// A 16:9 video between a 60 pixel header and a 65 pixel control bar, with a link to an article
// below them. Tuned to a 320 pixel frame, the ratio keeps the controls and crops the link.
const playerRatio = '9/10'

// MailOnline's video player, `/embed/video/{id}.html`. The video page's path holds a channel and a
// slug the id does not give, so no `url` is minted.
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
    ratio: playerRatio,
    title: attr(element, 'title'),
  }
}

export const dailymailEmbedResolver = createUrlEmbedResolver(dailymailHosts, dailymailResolveEmbed)

export const dailymailFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'MailOnline Embed Player' },
]
