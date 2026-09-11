import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'scratch'

const scratchHosts = ['scratch.mit.edu']

// The current spelling and the legacy one. Both answer the same javascript shell.
const projectEmbedRegex = /^\/+projects\/(?:(\d+)\/embed|embed\/(\d+))\/?$/

// Scratch's project player. The thumbnail service answers 200 for anything, a generic stub for a
// project that does not exist.
export const scratchResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, scratchHosts)
  const match = parsed?.pathname.match(projectEmbedRegex)
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
  }
}

export const scratchEmbedResolver = createUrlEmbedResolver(scratchHosts, scratchResolveEmbed)
