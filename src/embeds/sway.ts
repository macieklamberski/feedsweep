import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'sway'

const swayHosts = ['sway.cloud.microsoft', 'sway.com', 'sway.office.com']

// Microsoft Sway's embed iframe, `/s/{id}/embed`, on any of its three hosts. The ids are one space
// and case-sensitive, and the route words answer in any case.
export const swayResolveEmbed: ResolveUrlEmbed = (_url, _element, parsed) => {
  const [route, id, kind, ...rest] = getPathSegments(parsed)

  if (!isAnyOf(route, 's') || !isAnyOf(kind, 'embed') || rest.length > 0) {
    return
  }

  // The oEmbed endpoint on `sway.cloud.microsoft` answers only a url on its own host.
  return {
    provider,
    id,
    src: `https://sway.cloud.microsoft/s/${id}/embed`,
    url: `https://sway.cloud.microsoft/${id}`,
    height: 500,
  }
}

export const swayEmbedResolver = createUrlEmbedResolver(swayHosts, swayResolveEmbed)
