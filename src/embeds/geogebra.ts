import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'geogebra'

// Listed exactly, not by subdomain: tube.geogebra.org no longer resolves and its numeric ids
// do not map onto the current materials.
const geogebraHosts = ['geogebra.org', 'www.geogebra.org']

type Material = {
  id: string
  layout: string
}

// The iframe reads its options as `/{key}/{value}` pairs after the id, the last one winning.
// `width` and `height` set the size the applet is laid out at before it is scaled to the frame.
const readLayout = (options: Array<string>): string => {
  let width: string | undefined
  let height: string | undefined

  for (let index = 0; index < options.length; index += 2) {
    const value = options[index + 1]

    if (options[index] === 'width') {
      width = value
    }

    if (options[index] === 'height') {
      height = value
    }
  }

  if (!width || !height) {
    return ''
  }

  return `/width/${width}/height/${height}`
}

const readMaterial = (segments: Array<string>): Material | undefined => {
  const [route, ...rest] = segments

  if (route === 'material') {
    const [kind, idWord, id, ...options] = rest

    if (kind !== 'iframe' || idWord !== 'id' || !id) {
      return
    }

    return {
      id,
      layout: readLayout(options),
    }
  }

  if ((isAnyOf(route, 'm') || route === 'classic') && rest.length === 1) {
    return {
      id: rest[0],
      layout: '',
    }
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

  const material = readMaterial(getPathSegments(parsed))

  if (!material) {
    return
  }

  // The iframe lays the applet out at 800 by 600 when the path names no width and height, and
  // scales it into the frame at its own ratio.
  return {
    provider,
    id: material.id,
    src: `https://www.geogebra.org/material/iframe/id/${material.id}${material.layout}`,
    url: `https://www.geogebra.org/m/${material.id}`,
    ratio: '4/3',
  }
}

export const geogebraEmbedResolver = createUrlEmbedResolver(geogebraHosts, geogebraResolveEmbed)
