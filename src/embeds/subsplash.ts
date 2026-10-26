import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'subsplash'

const sizes = { player: { ratio: '16/9' } }

const subsplashHosts = ['subsplash.com']

const leadingPlusRegex = /^\+/

// A media item's short code names it on every org's path and on the `subspla.sh` share link,
// whatever its case, so the key is the code alone.
const composeEmbed = (id: string, src: string): EmbedResolverResult => {
  const key = id.toLowerCase()

  return {
    provider,
    id: key,
    src,
    url: `https://subspla.sh/${key}`,
    ...sizes.player,
  }
}

// Subsplash's media item player, `/u/{org}/media/embed/d/{id}` today and
// `/+{app}/embed/mi/+{id}` before. The old route redirects to an org path the app key does not
// map to offline, so it is kept. The embed reads `t` as the start position, and the rest of its
// query, `audio`, `video`, `info`, `logoWatermark`, `shareable` and `embeddable`, only changes
// the display or is ignored.
export const subsplashResolveEmbed: ResolveUrlEmbed = (url) => {
  const segments = getPathSegments(url)

  if (segments.length === 6) {
    const [user, org, media, embed, d, id] = segments

    if (
      !isAnyOf(user, 'u') ||
      !isAnyOf(media, 'media') ||
      !isAnyOf(embed, 'embed') ||
      !isAnyOf(d, 'd')
    ) {
      return
    }

    const query = pickUrlParams(url, ['t'])

    return composeEmbed(id, `https://subsplash.com/u/${org}/media/embed/d/${id}${query}`)
  }

  if (segments.length === 4) {
    const [app, embed, mi, id] = segments

    if (!app.startsWith('+') || !isAnyOf(embed, 'embed') || !isAnyOf(mi, 'mi')) {
      return
    }

    return composeEmbed(
      id.replace(leadingPlusRegex, ''),
      `https://subsplash.com/${app}/embed/mi/${id}`,
    )
  }
}

export const subsplashEmbedResolver = createUrlEmbedResolver(subsplashHosts, subsplashResolveEmbed)
