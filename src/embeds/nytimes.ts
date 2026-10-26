import { composeQuery, getQueryParam, isAnyOf } from 'trousse'
import type { FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'nytimes'

// `static01.nyt.com` is the static host, which 301s the player onto `www.nytimes.com`.
const nytimesHosts = ['nytimes.com', 'static01.nyt.com']

// The player pages: the current one, which `graphics8.nytimes.com` 301s onto `www`, and the
// Brightcove-era `bcvideo` one, which answers 400 for every id today. Both name the video the
// same way, and the current player plays a 2011 `bcvideo` id, so the repair is a path swap.
const playerPath = '/video/players/offsite/index.html'
const legacyPlayerPath = '/bcvideo/1.0/iframe/embed.html'

const sizes = {
  // A footer of share links sits under the 16:9 video. NYT's own snippet sizes the player 480
  // by 321.
  player: { ratio: '16/9' },
}
const footerHeight = 71

// The video page is `/video/{section}/{id}/{slug}.html`, and neither the section nor the slug is
// in the embed, so no `url` is minted. The player discriminates in a browser only: a fabricated
// id answers 200 with the same 695 byte shell and renders "Video Data Failed to Load".
export const nytimesResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const id = getQueryParam(url.searchParams, 'videoId')

  if (!isAnyOf(url.pathname, [playerPath, legacyPlayerPath])) {
    return
  }

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.nytimes.com${playerPath}${composeQuery({ videoId: id })}`,
    ...sizes.player,
    ratioHeightOffset: footerHeight,
    title: attr(element, 'title'),
  }
}

// NYT's offsite video player iframe, current or Brightcove-era bcvideo, keyed by videoId.
export const nytimesIframeEmbedResolver = createUrlEmbedResolver(nytimesHosts, nytimesResolveEmbed)

export const nytimesFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'New York Times Video - Embed Player' },
]
