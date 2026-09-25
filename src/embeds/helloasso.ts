import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'helloasso'

const helloassoHosts = ['helloasso.com']

// The box HelloAsso's snippet reserves for each kind. The full form grows to fit its steps.
const widgetSizes: Record<string, Pick<EmbedResolverResult, 'width' | 'height'>> = {
  widget: { height: 750 },
  'widget-bouton': { height: 70 },
  'widget-vignette': { width: 350, height: 450 },
}

// A donation, membership, ticketing or shop form, framed from
// `/associations/{org}/{type}/{slug}/{kind}`, where the kind is `widget`, `widget-bouton`,
// `widget-vignette` or `widget-compteur`. The form page drops the kind segment.
export const helloassoResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, helloassoHosts)

  if (!parsed) {
    return
  }

  const [route, org, type, slug, kind, ...rest] = getPathSegments(parsed)

  if (route !== 'associations' || rest.length > 0 || !kind?.startsWith('widget')) {
    return
  }

  return {
    provider,
    id: `${org}/${type}/${slug}`,
    // The kind segment picks the button, the card or the full form the publisher chose.
    src: url,
    url: `https://www.helloasso.com/associations/${org}/${type}/${slug}`,
    ...widgetSizes[kind],
  }
}

// HelloAsso's form widget iframe.
export const helloassoEmbedResolver = createUrlEmbedResolver(helloassoHosts, helloassoResolveEmbed)
