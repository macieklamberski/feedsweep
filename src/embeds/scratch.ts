import { isHostOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'scratch'

// The subdomains `assets`, `cdn2` and `uploads` serve files, so only the page hosts are read.
const hosts = [
  'alpha.scratch.mit.edu', // The retired Scratch 2.0 host, sharing the main site's ids
  'scratch.mit.edu',
]

// The current spelling and the legacy one, which redirects to it.
const projectEmbedRegex = /^\/projects\/(?:([^/]+)\/embed|embed\/([^/]+))\/?$/i

// The box the share snippet writes.
const sizes = {
  player: { width: 485, height: 402 },
}

// Scratch's project player.
export const scratchResolveEmbed: ResolveUrlEmbed = (url) => {
  const match = url.pathname.match(projectEmbedRegex)
  const projectId = match?.[1] ?? match?.[2]

  if (!projectId) {
    return
  }

  return {
    provider,
    id: projectId,
    src: `https://scratch.mit.edu/projects/${projectId}/embed`,
    url: `https://scratch.mit.edu/projects/${projectId}/`,
    thumbnail: `https://cdn2.scratch.mit.edu/get_image/project/${projectId}_480x360.png`,
    ...sizes.player,
  }
}

export const scratchEmbedResolver = createUrlEmbedResolver(hosts, scratchResolveEmbed, {
  isOnHost: isHostOf,
})
