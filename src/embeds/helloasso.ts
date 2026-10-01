import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { readObjectHeight } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'helloasso'

const helloassoHosts = ['helloasso.com']

// A donation, membership, ticketing or shop form, framed from
// `/associations/{org}/{type}/{slug}/{kind}`, where the kind is `widget` or a `widget-` variant
// such as `widget-bouton` or `widget-vignette-horizontale`. The form page drops the kind segment.
export const helloassoResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, helloassoHosts)

  if (!parsed) {
    return
  }

  const [route, org, type, slug, kind, ...rest] = getPathSegments(parsed)

  if (route !== 'associations' || rest.length > 0 || !kind?.startsWith('widget')) {
    return
  }

  // Every variant is minted as the full form.
  return {
    provider,
    id: `${org}/${type}/${slug}`,
    src: `https://www.helloasso.com/associations/${org}/${type}/${slug}/widget`,
    url: `https://www.helloasso.com/associations/${org}/${type}/${slug}`,
  }
}

// HelloAsso's form widget iframe.
export const helloassoEmbedResolver = createUrlEmbedResolver(helloassoHosts, helloassoResolveEmbed)

// The form posts its rendered height unasked as `{ height }`, again on each step it grows to.
export const helloassoRenderHint: EmbedRenderHint = {
  provider,
  readHeight: readObjectHeight,
}
