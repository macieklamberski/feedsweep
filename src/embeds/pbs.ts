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

// The frame is a 16:9 video above a control bar that keeps its height whatever the width. Four
// widths from 520 to 1400 fit `height = width * 9 / 16 + 41.5` exactly, so neither a ratio nor a
// fixed height describes it alone. `13/9` is the ratio that covers the bar at 320 wide and grows
// a little slack above it, because a short box crops the controls while a tall one shows a strip
// of background. A carrier that states its own box still wins: the 512 by 332 publishers write
// is within three pixels of the measured height at that width.
const playerRatio = '13/9'

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
    ratio: playerRatio,
  }
}

export const pbsEmbedResolver = createUrlEmbedResolver(pbsHosts, pbsResolveEmbed)
