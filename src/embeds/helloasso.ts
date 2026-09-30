import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver, getEmbedSize } from '../utils/widgets.js'

const provider = 'helloasso'

const helloassoHosts = ['helloasso.com']

// The box HelloAsso's snippet reserves for the full form, which grows to fit its steps.
const formHeight = 750

// A donation, membership, ticketing or shop form, framed from
// `/associations/{org}/{type}/{slug}/{kind}`, where the kind is `widget` or a `widget-` variant
// such as `widget-bouton` or `widget-vignette-horizontale`. The form page drops the kind segment.
export const helloassoResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, helloassoHosts)

  if (!parsed) {
    return
  }

  const [route, org, type, slug, kind, ...rest] = getPathSegments(parsed)

  if (route !== 'associations' || rest.length > 0 || !kind?.startsWith('widget')) {
    return
  }

  // Every variant is minted as the full form. A form carrier's own height stands, while a button
  // or card carrier's box was drawn for a variant the mint no longer loads.
  const isSizedForm = kind === 'widget' && !!element && !!getEmbedSize(element, 0).height

  return {
    provider,
    id: `${org}/${type}/${slug}`,
    src: `https://www.helloasso.com/associations/${org}/${type}/${slug}/widget`,
    url: `https://www.helloasso.com/associations/${org}/${type}/${slug}`,
    height: isSizedForm ? undefined : formHeight,
  }
}

// HelloAsso's form widget iframe.
export const helloassoEmbedResolver = createUrlEmbedResolver(
  helloassoHosts,
  helloassoResolveEmbed,
  {
    preferResolverSize: true,
  },
)
