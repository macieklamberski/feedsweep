import { composeQuery, getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'cnbc'

const sizes = {
  // The JW player runs in aspect mode with a 56.25% spacer and its title band inside the picture.
  // CNBC's own snippet states 560 by 349, which leaves 34 pixels blank at that width.
  player: { ratio: '16/9' },
}

const cnbcHosts = ['player.cnbc.com']

// CNBC's player.cnbc.com clip iframe, pasted in a box taller than the 16:9 clip it fills.
// It answers 200 for any guid, with a not-found page in the body for a fabricated one. The
// Flash-era `plus.cnbc.com/rssvideosearch/…/id/{id}` ids are another space and get that page.
export const cnbcResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, account, player, extra] = getPathSegments(url)
  const guid = getQueryParam(url.searchParams, 'byGuid')

  if (!isAnyOf(route, 'p') || !player || extra) {
    return
  }

  if (!guid) {
    return
  }

  const query = composeQuery({ playertype: 'synd', byGuid: guid })

  return {
    provider,
    id: guid,
    // Any player name plays the guid, and `cnbc_global` is the one CNBC's share snippet writes.
    // Another account answers 404, so the account stays as written.
    src: `https://player.cnbc.com/p/${account}/cnbc_global${query}`,
    ...sizes.player,
  }
}

export const cnbcIframeEmbedResolver = createUrlEmbedResolver(cnbcHosts, cnbcResolveEmbed)
