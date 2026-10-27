import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { digitsRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'thinglink'

const hosts = ['thinglink.com']

const sizes = {
  scene: { ratio: '3/2' },
}

// The four viewer routes share one snowflake id space, so an id taken off any of them addresses
// the same scene under `card`, the viewer ThingLink's oEmbed writes for every kind.
const cardRoutes = ['card', 'mediacard', 'videocard']

const readSceneId = (url: URL): string | undefined => {
  const [route = '', second, third] = getPathSegments(url)

  if (isAnyOf(route, 'view')) {
    if (!isAnyOf(second, 'scene')) {
      return
    }

    return third
  }

  if (!isAnyOf(route, cardRoutes)) {
    return
  }

  return second
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

export const thinglinkResolveEmbed: ResolveUrlEmbed = (url) => {
  const id = readSceneId(url)

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.thinglink.com/card/${id}`,
    // ThingLink's oEmbed answers the `scene` page and refuses the `card` viewer.
    url: `https://www.thinglink.com/scene/${id}`,
    thumbnail: composePosterUrl(id),
    ...sizes.scene,
  }
}

// ThingLink's interactive-image viewer, framed at `card`, `view/scene`, `mediacard` or
// `videocard`. The `cdn.thinglink.me/jse/embed.js` script form is not read: it hydrates the
// `img.alwaysThinglink` beside it, which survives as the scene's static render.
export const thinglinkEmbedResolver = createUrlEmbedResolver(hosts, thinglinkResolveEmbed)
