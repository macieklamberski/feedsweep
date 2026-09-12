import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const thinglinkHost = 'thinglink.com'

// The four viewer routes share one snowflake id space, so an id taken off any of them addresses
// the same scene under `card`.
const cardRoutes = new Set(['card', 'mediacard', 'videocard'])

const sceneIdRegex = /^\d+$/

const readSceneId = (url: URL): string | undefined => {
  const [route = '', second, third] = getPathSegments(url)

  if (route === 'view') {
    return second === 'scene' ? third : undefined
  }

  return cardRoutes.has(route) ? second : undefined
}

// The `cdn.thinglink.me/api/image/{id}` poster answers 200 with a grey placeholder png for the
// newer scenes, which nothing downstream can tell from a real one, so the thumbnail stays empty
// for enrichment to fill.
export const thinglinkResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, thinglinkHost)
  const id = parsed && readSceneId(parsed)

  if (!id || !sceneIdRegex.test(id)) {
    return
  }

  return {
    provider: 'thinglink',
    id,
    src: url,
    url: `https://www.thinglink.com/card/${id}`,
  }
}

// ThingLink's interactive-image viewer, framed at `card`, `view/scene`, `mediacard` or
// `videocard`. The `cdn.thinglink.me/jse/embed.js` script form is not read: it hydrates the
// `img.alwaysThinglink` beside it, which survives as the scene's static render.
export const thinglinkEmbedResolver = createUrlEmbedResolver([thinglinkHost], thinglinkResolveEmbed)
