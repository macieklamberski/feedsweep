import { getPathSegments, isPlainObject, trimObject } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'donorbox'

const donorboxHosts = ['donorbox.org']

// 900 is what the later steps need, where the first step measures 733.
// Donorbox's own snippet reserves 900, and the form does not grow with its container.
const formHeight = 900

// Only `/embed/{slug}` is a form. The campaign page sits at `/{slug}` and is what the
// placeholder links to; the blog and event routes name nothing embeddable.
export const donorboxResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, donorboxHosts)

  if (!parsed) {
    return
  }

  const [kind, slug, ...rest] = getPathSegments(parsed)

  if (kind !== 'embed' || !slug || rest.length > 0) {
    return
  }

  // The amount prefills the donation. The rest of the query is the form's look.
  const amount = parsed.searchParams.get('amount') ?? undefined
  const query = composeQuery(trimObject({ amount }, Boolean))

  return {
    provider,
    id: slug,
    src: `https://donorbox.org/embed/${slug}${query}`,
    url: `https://donorbox.org/${slug}`,
    height: formHeight,
  }
}

// Donorbox's donation form iframe, sized by a loader script that feeds strip.
export const donorboxEmbedResolver = createUrlEmbedResolver(donorboxHosts, donorboxResolveEmbed)

// The form posts its rendered height unasked, as `{ from: 'dbox', src, height }`, and answers a
// posted `{ action: 'please-resize-me' }` with the same message.
export const readDonorboxHeight = (data: unknown): number | undefined => {
  return isPlainObject(data) && data.from === 'dbox' ? readPixels(data.height) : undefined
}

export const donorboxRenderHint: EmbedRenderHint = {
  provider,
  // Spelled out: a `www.` src 301s to the apex, so every message arrives from here.
  origin: 'https://donorbox.org',
  requestHeight: { action: 'please-resize-me' },
  readHeight: readDonorboxHeight,
}
