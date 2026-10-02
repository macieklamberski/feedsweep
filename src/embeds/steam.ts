import { getPathSegments, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// The store's purchase box is a fixed bar.
const widgetHeight = 190

// `t` is the text the widget prints under the game's name.
const widgetParams = ['t']

// Steam's store widget, `store.steampowered.com/widget/{appId}`, with an optional purchase option
// after the app and a `t=` description in the query.
export const steamResolveEmbed: ResolveEmbed = (url) => {
  const [route, appId, subId] = getPathSegments(url)

  if (route !== 'widget' || !appId) {
    return
  }

  const widget = subId ? `${appId}/${subId}` : appId
  // The widget prints `t` in place of the game's own blurb, so it is the publisher's text.
  const parsed = parseUrl(url)
  const description = parsed?.searchParams.get('t')?.trim() || undefined

  return {
    provider: 'steam',
    id: appId,
    src: `https://store.steampowered.com/widget/${widget}/${pickUrlParams(url, widgetParams)}`,
    url: `https://store.steampowered.com/app/${appId}/`,
    thumbnail: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    height: widgetHeight,
    description,
  }
}

export const steamEmbedResolver = createUrlEmbedResolver(
  ['store.steampowered.com'],
  steamResolveEmbed,
)
