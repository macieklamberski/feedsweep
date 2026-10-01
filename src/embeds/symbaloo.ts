import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'symbaloo'

// Any webspace subdomain, such as `edu.symbaloo.com`, serves the same webmixes.
const symbalooHosts = ['symbaloo.com']

const webmixHeight = 500

// Symbaloo's embedded webmix, `/embed/{slug}` for a published webmix and `/embed/shared/{token}`
// for one shared by link. The route words are case-sensitive, the slug and the token are not.
export const symbalooResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, symbalooHosts)

  if (!parsed) {
    return
  }

  const [route, name, token, ...rest] = getPathSegments(parsed)

  if (route !== 'embed' || !name || rest.length > 0) {
    return
  }

  // A two-segment `/embed/shared` is the webmix whose slug is `shared`.
  if (token) {
    if (name !== 'shared') {
      return
    }

    // The token opens a webmix shared by link, so it stays in `src` alone.
    return {
      provider,
      src: `https://www.symbaloo.com/embed/shared/${token}`,
      height: webmixHeight,
    }
  }

  return {
    provider,
    id: name.toLowerCase(),
    src: `https://www.symbaloo.com/embed/${name}`,
    url: `https://www.symbaloo.com/mix/${name}`,
    height: webmixHeight,
  }
}

export const symbalooEmbedResolver = createUrlEmbedResolver(symbalooHosts, symbalooResolveEmbed)
