import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'geogebra'

// Listed exactly, not by subdomain: tube.geogebra.org no longer resolves and its numeric ids
// do not map onto the current materials.
const geogebraHosts = ['geogebra.org', 'www.geogebra.org']

const readMaterialId = (segments: Array<string>): string | undefined => {
  const [route, ...rest] = segments

  if (route === 'material') {
    const [kind, idWord, id] = rest

    if (kind === 'iframe' && idWord === 'id') {
      return id
    }

    return
  }

  if ((isAnyOf(route, 'm') || route === 'classic') && rest.length === 1) {
    return rest[0]
  }
}

// GeoGebra's material iframe, `/material/iframe/id/{id}` with its options as `/{key}/{value}`
// pairs, and the material page `/m/{id}` and the Classic app `/classic/{id}` framed instead.
// The ids and every route word but `m` are case-sensitive.
export const geogebraResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, geogebraHosts)) {
    return
  }

  const id = readMaterialId(getPathSegments(parsed))

  if (!id) {
    return
  }

  // The iframe scales the applet to fill the frame at 4:3, the 800 by 600 it defaults to
  // when the path names no width and height.
  return {
    provider,
    id,
    src: `https://www.geogebra.org/material/iframe/id/${id}`,
    url: `https://www.geogebra.org/m/${id}`,
    ratio: '4/3',
  }
}

export const geogebraEmbedResolver = createUrlEmbedResolver(geogebraHosts, geogebraResolveEmbed)
