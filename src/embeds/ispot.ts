import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const ispotHosts = ['www.ispot.tv']

// iSpot.tv's TV commercial player, `www.ispot.tv/share/{id}`. The id is case-sensitive: another
// casing names another spot or none. The `/ad/{id}` page answers 404 without its slug, so no page
// url composes from the id.
export const ispotResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, ispotHosts)

  if (!parsed) {
    return
  }

  const [route, id, ...rest] = getPathSegments(parsed)

  if (route !== 'share' || !id || rest.length > 0) {
    return
  }

  return {
    provider: 'ispot',
    id,
    src: `https://www.ispot.tv/share/${id}`,
    thumbnail: `https://images-cdn.ispot.tv/ad/${id}/default-large.jpg`,
    ratio: '320/222',
  }
}

export const ispotEmbedResolver = createUrlEmbedResolver(ispotHosts, ispotResolveEmbed)
