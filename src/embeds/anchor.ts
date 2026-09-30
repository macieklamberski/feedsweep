import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// One service, three host generations, all still live in feeds: `anchor.fm` became
// `podcasters.spotify.com` became `creators.spotify.com`. The Spotify resolver matches the
// spotify.com hosts but rejects these paths, so they fall through to here.
const anchorHosts = ['anchor.fm', 'podcasters.spotify.com', 'creators.spotify.com']

// Spotify's snippet writes 102, but the card is 100 and the two extra pixels render as white.
// `anchor.fm` and `podcasters.spotify.com` both redirect to the `creators.spotify.com` player.
// From 768 wide up the card is 161 tall, and the page fills any taller frame with white.
const playerHeight = 100

// `anchor.fm/{show}/embed/episodes/{slug}`,
// `podcasters.spotify.com/pod/show/{show}/embed/episodes/{slug}`,
// `creators.spotify.com/pod/profile/{user}/embed/episodes/{slug}/{audioId}`.
export const extractAnchorEpisode = (link: string): string | undefined => {
  const segments = getPathSegments(link)
  const marker = segments.indexOf('embed')

  if (marker < 1 || segments[marker + 1] !== 'episodes') {
    return
  }

  const show = segments[marker - 1]
  const episode = segments[marker + 2]

  if (!episode) {
    return
  }

  return `${show}/${episode}`
}

// `anchor.fm/{show}/embed`, `podcasters.spotify.com/pod/show/{show}/embed`,
// `creators.spotify.com/pod/profile/{show}/embed`.
const extractAnchorShow = (link: string): string | undefined => {
  const segments = getPathSegments(link)

  if (segments.at(-1) !== 'embed') {
    return
  }

  return segments.at(-2)
}

// The player carries no metadata, and Anchor's old oEmbed endpoint is gone.
export const anchorResolveEmbed: ResolveEmbed = (url) => {
  const episode = extractAnchorEpisode(url)

  if (episode) {
    const [show, slug] = episode.split('/')

    return {
      provider: 'anchor',
      id: episode,
      src: `https://creators.spotify.com/pod/profile/${show}/embed/episodes/${slug}`,
      height: playerHeight,
    }
  }

  const show = extractAnchorShow(url)

  if (!show) {
    return
  }

  return {
    provider: 'anchor',
    id: show,
    src: `https://creators.spotify.com/pod/profile/${show}/embed`,
    height: playerHeight,
  }
}

// Anchor's episode and show player iframes, on the anchor.fm host and the two Spotify hosts it
// became.
export const anchorEmbedResolver = createUrlEmbedResolver(anchorHosts, anchorResolveEmbed)
