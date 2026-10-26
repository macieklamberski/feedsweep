import { getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { digitsRegex, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'steam'

const sizes = {
  // The store's purchase box is a fixed bar.
  player: { height: 190 },
}

// `t` is the text the widget prints under the game's name.
const widgetParams = ['t']

// Steam's store widget, `store.steampowered.com/widget/{appId}`, with an optional purchase option
// after the app and a `t=` description in the query.
export const steamResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, appId, subId] = getPathSegments(url)

  if (!isAnyOf(route, 'widget') || !digitsRegex.test(appId)) {
    return
  }

  if (subId && !digitsRegex.test(subId)) {
    return
  }

  const widget = subId ? `${appId}/${subId}` : appId
  // The widget prints `t` in place of the game's own blurb, so it is the publisher's text.
  const description = getQueryParam(url.searchParams, 't')?.trim() || undefined

  return {
    provider,
    id: appId,
    src: `https://store.steampowered.com/widget/${widget}/${pickUrlParams(url, widgetParams)}`,
    url: `https://store.steampowered.com/app/${appId}/`,
    thumbnail: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    ...sizes.player,
    description,
  }
}

export const steamEmbedResolver = createUrlEmbedResolver(
  ['store.steampowered.com'],
  steamResolveEmbed,
)
