import { getPathSegments, isAnyOf, isHostOf, isPlainObject, parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'airtable'

// Exact: `static.airtable.com` serves the embed script and images.
const airtableHosts = ['airtable.com']

// A shared view is `shr…` and its base `app…`. An interface page `pag…` and a table `tbl…`
// share the same path depth, and the server matches both prefixes case-sensitively.
const shareIdRegex = /^shr/
const baseIdRegex = /^app/

// Airtable's snippet and oEmbed answer frame every view at 533.
const viewHeight = 533

// Airtable's shared view frame, `/embed/{shr}` from older snippets and `/embed/{app}/{shr}` from
// the current one. The bare form redirects to the base, which cannot be derived from the share.
export const airtableResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url)

  if (!parsed || !isHostOf(parsed, airtableHosts)) {
    return
  }

  const [route, ...ids] = getPathSegments(parsed)

  if (!isAnyOf(route, 'embed') || ids.length > 2) {
    return
  }

  const share = ids.at(-1)
  const base = ids.length === 2 ? ids[0] : undefined

  if (!share || !shareIdRegex.test(share)) {
    return
  }

  if (base !== undefined && !baseIdRegex.test(base)) {
    return
  }

  const id = ids.join('/')

  return {
    provider,
    id,
    src: `https://airtable.com/embed/${id}`,
    url: `https://airtable.com/${id}`,
    height: viewHeight,
  }
}

export const airtableEmbedResolver = createUrlEmbedResolver(airtableHosts, airtableResolveEmbed)

// A form view posts `{ key: 'airtableEmbedContentDidResize', height }` unasked. A grid, gallery
// or calendar view posts no height and keeps the stated one.
export const readAirtableHeight = (data: unknown): number | undefined => {
  if (isPlainObject(data) && data.key === 'airtableEmbedContentDidResize') {
    return readPixels(data.height)
  }
}

export const airtableRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://airtable.com',
  readHeight: readAirtableHeight,
}
