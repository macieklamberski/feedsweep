import { getPathSegments, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pbs'

const pbsHosts = ['player.pbs.org']

// The route a carrier names, against the id space it belongs to. `viralplayer` and
// `widget/partnerplayer` serve each other's numeric ids; `partnerplayer` takes a base64url slug
// and answers an error shell for a numeric one.
const idSpaces = toMap({
  viralplayer: 'viralplayer',
  'widget/partnerplayer': 'viralplayer',
  partnerplayer: 'partnerplayer',
})

const safeVideoIdRegex = /^[\w-]+={0,2}$/

// PBS's offsite player, which renders on its own but names no page and no poster. The route
// qualifies the id, since the two spaces share no grammar and an id alone addresses neither.
export const pbsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, pbsHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)
  const videoId = segments.at(-1)
  const idSpace = idSpaces.get(segments.slice(0, -1).join('/'))

  if (!videoId || !idSpace || !safeVideoIdRegex.test(videoId)) {
    return
  }

  return {
    provider,
    id: `${idSpace}/${videoId}`,
    src: url,
  }
}

export const pbsEmbedResolver = createUrlEmbedResolver(pbsHosts, pbsResolveEmbed)
