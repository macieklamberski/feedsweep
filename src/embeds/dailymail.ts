import type { FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'dailymail'

// Each edition's host serves the same player and 301s onto the reader's own edition.
const hosts = ['dailymail.co.uk', 'dailymail.com']

// The server matches the path in its own case only.
const playerPathRegex = /^\/embed\/video\/([^/]+)\.html$/i

const sizes = {
  // A 16:9 video between a header and title bar above and a control bar and headline below.
  player: { ratio: '16/9' },
}
const chromeHeight = 234

// MailOnline's video player, `/embed/video/{id}.html`.
export const dailymailResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const id = url.pathname.match(playerPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://${url.hostname}/embed/video/${id}.html`,
    url: `https://${url.hostname}/video/video-${id}.html`,
    ...sizes.player,
    ratioHeightOffset: chromeHeight,
    title: attr(element, 'title'),
  }
}

export const dailymailEmbedResolver = createUrlEmbedResolver(hosts, dailymailResolveEmbed)

export const dailymailFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'MailOnline Embed Player' },
]
