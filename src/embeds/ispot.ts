import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ispot'

const sizes = {
  commercial: { ratio: '16/9' },
}

const ispotHosts = ['www.ispot.tv']

// iSpot.tv's TV commercial player, `www.ispot.tv/share/{id}`. The id is case-sensitive: another
// casing names another spot or none. The `/ad/{id}` page answers 404 without its slug, so no page
// url composes from the id.
export const ispotResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, id, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, 'share') || !id || rest.length > 0) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.ispot.tv/share/${id}`,
    thumbnail: `https://images-cdn.ispot.tv/ad/${id}/default-large.jpg`,
    ...sizes.commercial,
  }
}

export const ispotEmbedResolver = createUrlEmbedResolver(ispotHosts, ispotResolveEmbed)
