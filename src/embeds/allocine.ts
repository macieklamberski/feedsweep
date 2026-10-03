import { isHostOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'allocine'

const allocineHosts = ['allocine.fr']

// The server matches every route in its own case only.
const blogPlayerPathRegex = /^\/_video\/iblogvision\.aspx$/
const flashPlayerPathRegex = /^\/blogvision\/([^/]+)$/
const playerPathRegex = /^\/([^/]+)\.html$/

// Every route names the trailer by the same `cmedia` id, in the path or in the query.
const readCmedia = (parsed: URL): string | null | undefined => {
  if (isHostOf(parsed, 'player.allocine.fr')) {
    return parsed.pathname.match(playerPathRegex)?.[1]
  }

  if (blogPlayerPathRegex.test(parsed.pathname)) {
    return parsed.searchParams.get('cmedia')
  }

  return parsed.pathname.match(flashPlayerPathRegex)?.[1]
}

// AlloCiné's trailer player, `player.allocine.fr/{cmedia}.html`, the embed the video page names.
// The blog player, `/_video/iblogvision.aspx?cmedia={cmedia}`, and the retired Flash player,
// `/blogvision/{cmedia}`, take the same id. The video page also needs the film's id, so no `url`.
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
