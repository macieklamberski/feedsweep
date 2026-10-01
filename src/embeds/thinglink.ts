import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { digitsRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const thinglinkHost = 'thinglink.com'

// The four viewer routes share one snowflake id space, so an id taken off any of them addresses
// the same scene under `card`, the viewer ThingLink's oEmbed writes for every kind.
const cardRoutes = new Set(['card', 'mediacard', 'videocard'])

const readSceneId = (url: URL): string | undefined => {
  const [route = '', second, third] = getPathSegments(url)

  if (route === 'view') {
    return second === 'scene' ? third : undefined
  }

  return cardRoutes.has(route) ? second : undefined
}

// A scene at or above this id states no poster, since `cdn.thinglink.me` redirects most of them to
// a shared missing-thumbnail png. A scene below it can still redirect.
const posterIdCeiling = 1200000000000000000n

const composePosterUrl = (id: string): string | undefined => {
  if (!digitsRegex.test(id) || BigInt(id) >= posterIdCeiling) {
    return
  }

  return `https://cdn.thinglink.me/api/image/${id}/1024/10/scaletowidth`
}

export const thinglinkResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, thinglinkHost)
  const id = parsed && readSceneId(parsed)

  if (!id) {
    return
  }

  return {
    provider: 'thinglink',
    id,
    src: `https://www.thinglink.com/card/${id}`,
    url: `https://www.thinglink.com/card/${id}`,
    thumbnail: composePosterUrl(id),
    ratio: '3/2',
  }
}

// ThingLink's interactive-image viewer, framed at `card`, `view/scene`, `mediacard` or
// `videocard`. The `cdn.thinglink.me/jse/embed.js` script form is not read: it hydrates the
// `img.alwaysThinglink` beside it, which survives as the scene's static render.
export const thinglinkEmbedResolver = createUrlEmbedResolver([thinglinkHost], thinglinkResolveEmbed)
