import { getPathSegments, isAnyOf, startsWithAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { readObjectHeight } from '../utils/hints.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'helloasso'

const hosts = ['helloasso.com']

// A donation, membership, ticketing or shop form, framed from
// `/associations/{org}/{type}/{slug}/{kind}`, where the kind is `widget` or a `widget-` variant
// such as `widget-bouton` or `widget-vignette-horizontale`. The form page drops the kind segment.
export const helloassoResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, org, type, slug, kind, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, 'associations') || rest.length > 0 || !startsWithAnyOf(kind, 'widget')) {
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
export const helloassoEmbedResolver = createUrlEmbedResolver(hosts, helloassoResolveEmbed)

// The form posts its rendered height unasked as `{ height }`, again on each step it grows to.
export const helloassoRenderHint: EmbedRenderHint = {
  provider,
  readHeight: readObjectHeight,
}
