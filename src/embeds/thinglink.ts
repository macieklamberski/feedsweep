import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { digitsRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'thinglink'

const hosts = ['thinglink.com']
const imageHosts = ['cdn.thinglink.me']

const sizes = {
  scene: { ratio: '3/2' },
}

// The four viewer routes share one snowflake id space, so an id taken off any of them addresses
// the same scene under `card`, the viewer ThingLink's oEmbed writes for every kind.
const cardRoutes = ['card', 'mediacard', 'videocard']

const readSceneId = (url: URL): string | undefined => {
  const [route = '', second, third] = getPathSegments(url)

  if (isAnyOf(route, 'view')) {
    return isAnyOf(second, 'scene') ? third : undefined
  }

  return isAnyOf(route, cardRoutes) ? second : undefined
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

const composeScene = (id: string, thumbnail: string | undefined): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `https://www.thinglink.com/card/${id}`,
    // ThingLink's oEmbed answers the `scene` page and refuses the `card` viewer.
    url: `https://www.thinglink.com/scene/${id}`,
    thumbnail,
    ...sizes.scene,
  }
}

export const thinglinkResolveEmbed: ResolveUrlEmbed = (url) => {
  const id = readSceneId(url)

  if (!id) {
    return
  }

  return composeScene(id, composePosterUrl(id))
}

// ThingLink's interactive-image viewer, framed at `card`, `view/scene`, `mediacard` or
// `videocard`.
export const thinglinkIframeEmbedResolver = createUrlEmbedResolver(hosts, thinglinkResolveEmbed)

// ThingLink's script embed: an `img.alwaysThinglink` of the scene's render, which
// `cdn.thinglink.me/jse/embed.js` turns into the viewer of the scene `api/image/{id}` names.
export const thinglinkImageEmbedResolver = createMarkupEmbedResolver(
  'img.alwaysThinglink[src]',
  (element) => {
    const src = attr(element, 'src')
    const image = parseUrlOnHosts(src, imageHosts)
    const [api, route, id] = image ? getPathSegments(image) : []

    if (!isAnyOf(api, 'api') || !isAnyOf(route, 'image') || !id || !digitsRegex.test(id)) {
      return
    }

    return composeScene(id, src)
  },
)
