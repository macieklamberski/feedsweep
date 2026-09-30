import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const cnbcHosts = ['player.cnbc.com']

// The JW player runs in aspect mode with a 56.25% spacer and its title band inside the picture.
// CNBC's own snippet states 560 by 349, which leaves 34 pixels blank at that width.
const playerRatio = '16/9'

// CNBC's player.cnbc.com clip iframe, pasted in a box taller than the 16:9 clip it fills.
// It answers 200 for any guid, with a not-found page in the body for a fabricated one. The
// Flash-era `plus.cnbc.com/rssvideosearch/…/id/{id}` ids are another space and get that page.
export const cnbcResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, cnbcHosts)
  const [route, account, player, extra] = parsed ? getPathSegments(parsed) : []
  const guid = parsed?.searchParams.get('byGuid')

  if (route !== 'p' || !player || extra) {
    return
  }

  if (!guid) {
    return
  }

  const query = composeQuery({ playertype: 'synd', byGuid: guid })

  return {
    provider: 'cnbc',
    id: guid,
    src: `https://player.cnbc.com/p/${account}/${player}${query}`,
    ratio: playerRatio,
  }
}

export const cnbcIframeEmbedResolver = createUrlEmbedResolver(cnbcHosts, cnbcResolveEmbed, {
  preferResolverSize: true,
})
