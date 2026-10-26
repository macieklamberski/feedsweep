import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'symbaloo'

// Exact: `cdn01.symbaloo.com` serves files, and `blog.symbaloo.com` answers its index to any path.
const symbalooHosts = ['symbaloo.com', 'www.symbaloo.com', 'edu.symbaloo.com']

const sizes = { player: { height: 500 } }

// Symbaloo's embedded webmix, `/embed/{slug}` for a published webmix and `/embed/shared/{token}`
// for one shared by link. The route words are read in any case. The slug is minted as written,
// and Symbaloo answers it in any case.
export const symbalooResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, name, token, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, 'embed') || !name || rest.length > 0) {
    return
  }

  // A two-segment `/embed/shared` is the webmix whose slug is `shared`.
  if (token) {
    if (!isAnyOf(name, 'shared')) {
      return
    }

    // The token opens a webmix shared by link, so it stays in `src` alone.
    return {
      provider,
      src: `https://www.symbaloo.com/embed/shared/${token}`,
      ...sizes.player,
    }
  }

  return {
    provider,
    id: name,
    src: `https://www.symbaloo.com/embed/${name}`,
    url: `https://www.symbaloo.com/mix/${name}`,
    ...sizes.player,
  }
}

export const symbalooEmbedResolver = createUrlEmbedResolver(symbalooHosts, symbalooResolveEmbed, {
  isOnHost: isHostOf,
})
