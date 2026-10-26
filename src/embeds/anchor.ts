import { getPathSegments, isAnyOf, isHostOrSubdomainOf } from 'trousse'
import type { FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'anchor'

// One service, three host generations, all still live in feeds: `anchor.fm` became
// `podcasters.spotify.com` became `creators.spotify.com`. The Spotify resolver matches the
// spotify.com hosts but rejects these paths, so they fall through to here.
const hosts = ['anchor.fm', 'podcasters.spotify.com', 'creators.spotify.com']

const sizes = {
  // Spotify's snippet writes 102, but the card is 100 and the two extra pixels render as white.
  // `anchor.fm` and `podcasters.spotify.com` both redirect to the `creators.spotify.com` player.
  // From 768 wide up the card is 161 tall, and the page fills any taller frame with white.
  player: { height: 100 },
}

// `anchor.fm/{show}/embed/episodes/{slug}`,
// `podcasters.spotify.com/pod/show/{show}/embed/episodes/{slug}`,
// `creators.spotify.com/pod/profile/{user}/embed/episodes/{slug}/{audioId}`.
export const extractAnchorEpisode = (link: URL): string | undefined => {
  const segments = getPathSegments(link)
  const marker = segments.findIndex((segment) => isAnyOf(segment, 'embed'))

  if (marker < 1 || !isAnyOf(segments[marker + 1], 'episodes')) {
    return
  }

  const show = segments[marker - 1]
  const episode = segments[marker + 2]

  if (!episode) {
    return
  }

  return `${show}/${episode}`
}

const anchorShowPathRegex = /^\/([^/]+)\/embed\/?$/i
const anchorEpisodePagePathRegex = /^\/(?<show>[^/]+)\/episodes\/(?<slug>[^/]+)\/?$/i
const spotifyShowPathRegex = /^\/pod\/(?:show|profile)\/([^/]+)\/embed\/?$/i

// `anchor.fm/{show}/embed`, `podcasters.spotify.com/pod/show/{show}/embed`,
// `creators.spotify.com/pod/profile/{show}/embed`.
const extractAnchorShow = (url: URL): string | undefined => {
  const pathRegex = isHostOrSubdomainOf(url, ['anchor.fm'])
    ? anchorShowPathRegex
    : spotifyShowPathRegex

  return url.pathname.match(pathRegex)?.[1]
}

// The episode page, `anchor.fm/{show}/episodes/{slug}`, names the same episode as its player.
const extractAnchorEpisodePage = (url: URL): string | undefined => {
  if (!isHostOrSubdomainOf(url, ['anchor.fm'])) {
    return
  }

  const page = url.pathname.match(anchorEpisodePagePathRegex)?.groups

  if (!page?.show || !page.slug) {
    return
  }

  return `${page.show}/${page.slug}`
}

// The player carries no metadata, and Anchor's old oEmbed endpoint is gone.
export const anchorResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const episode = extractAnchorEpisode(url) ?? extractAnchorEpisodePage(url)

  if (episode) {
    const [show, slug] = episode.split('/')

    return {
      provider,
      id: episode,
      src: `https://creators.spotify.com/pod/profile/${show}/embed/episodes/${slug}`,
      ...sizes.player,
      title: attr(element, 'title'),
    }
  }

  const show = extractAnchorShow(url)

  if (!show) {
    return
  }

  return {
    provider,
    id: show,
    src: `https://creators.spotify.com/pod/profile/${show}/embed`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

// Anchor's episode and show player iframes, on the anchor.fm host and the two Spotify hosts it
// became, and an anchor.fm episode page, rebuilt onto its player.
export const anchorEmbedResolver = createUrlEmbedResolver(hosts, anchorResolveEmbed)

export const anchorFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'myFrame' },
]
