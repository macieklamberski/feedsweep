import { isHostOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'allocine'

const allocineHosts = ['allocine.fr']

// The server matches both routes in their own case only.
const blogPlayerPathRegex = /^\/_video\/iblogvision\.aspx$/
const playerPathRegex = /^\/([^/]+)\.html$/

// The two routes name the trailer by the same `cmedia` id, one in the path and one in the query.
const readCmedia = (parsed: URL): string | null | undefined => {
  if (isHostOf(parsed, 'player.allocine.fr')) {
    return parsed.pathname.match(playerPathRegex)?.[1]
  }

  if (blogPlayerPathRegex.test(parsed.pathname)) {
    return parsed.searchParams.get('cmedia')
  }
}

// AlloCiné's trailer player, `player.allocine.fr/{cmedia}.html`, the url the video page names as
// its embed. The blog player, `www.allocine.fr/_video/iblogvision.aspx?cmedia={cmedia}`, serves
// the same player by the same id. The video page's path also needs the film's id, so no `url`.
export const allocineResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, allocineHosts)

  if (!parsed) {
    return
  }

  const cmedia = readCmedia(parsed)

  if (!cmedia) {
    return
  }

  return {
    provider,
    id: cmedia,
    src: `https://player.allocine.fr/${encodePathSegment(cmedia)}.html`,
    ratio: '16/9',
  }
}

export const allocineEmbedResolver = createUrlEmbedResolver(allocineHosts, allocineResolveEmbed)
