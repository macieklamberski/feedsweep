import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// An app id is a number, and so is the purchase option the widget may name after it.
const safeIdRegex = /^\d+$/

// The store's purchase box is a fixed bar.
const widgetHeight = 190

// Steam's store widget, `store.steampowered.com/widget/{appId}`, with an optional purchase option
// after the app and a `t=` description in the query. The header art derives from the app id on
// Steam's CDN, where a real id answers a jpeg and an unknown one a 404.
export const steamResolveEmbed: ResolveEmbed = (url) => {
  const [route, appId, subId, ...rest] = getPathSegments(url)

  if (route !== 'widget' || !appId || !safeIdRegex.test(appId) || rest.length) {
    return
  }

  if (subId && !safeIdRegex.test(subId)) {
    return
  }

  const widget = subId ? `${appId}/${subId}` : appId

  return {
    provider: 'steam',
    id: appId,
    src: `https://store.steampowered.com/widget/${widget}/`,
    url: `https://store.steampowered.com/app/${appId}/`,
    thumbnail: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    height: widgetHeight,
  }
}

export const steamEmbedResolver = createUrlEmbedResolver(
  ['store.steampowered.com'],
  steamResolveEmbed,
)
