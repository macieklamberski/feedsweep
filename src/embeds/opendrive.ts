import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'opendrive'

// Not `opendrive.com` and its other subdomains: `web.opendrive.com` serves the files themselves.
const opendriveHosts = ['www.opendrive.com']

// `listen` is the older route, and it 302s to `player` with the same id.
const playerRoutes = ['player', 'listen']

const sizes = {
  // The audio player is a controls bar 25 tall at every width.
  player: { height: 25 },
}

// An OpenDrive file player, framed as `/player/{fileId}`.
export const opendriveResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, fileId, ...rest] = getPathSegments(url)

  if (!fileId || rest.length > 0 || !isAnyOf(route, playerRoutes)) {
    return
  }

  return {
    provider,
    id: fileId,
    src: `https://www.opendrive.com/player/${fileId}`,
    url: `https://od.lk/f/${fileId}`,
    ...sizes.player,
  }
}

export const opendriveEmbedResolver = createUrlEmbedResolver(opendriveHosts, opendriveResolveEmbed)
