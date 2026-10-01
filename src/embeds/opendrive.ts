import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'opendrive'

// Not `opendrive.com` and its other subdomains: `web.opendrive.com` serves the files themselves.
const opendriveHosts = ['www.opendrive.com']

// `listen` is the older route, and it 302s to `player` with the same id.
const playerRoutes = ['player', 'listen']

// The audio player is a controls bar 25 tall at every width.
const playerHeight = 25

// An OpenDrive file player, framed as `/player/{fileId}`.
export const opendriveResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, opendriveHosts)

  if (!parsed) {
    return
  }

  const [route, fileId, ...rest] = getPathSegments(parsed)

  if (!fileId || rest.length > 0 || !playerRoutes.includes(route ?? '')) {
    return
  }

  return {
    provider,
    id: fileId,
    src: `https://www.opendrive.com/player/${fileId}`,
    url: `https://od.lk/f/${fileId}`,
    height: playerHeight,
  }
}

export const opendriveEmbedResolver = createUrlEmbedResolver(opendriveHosts, opendriveResolveEmbed)
