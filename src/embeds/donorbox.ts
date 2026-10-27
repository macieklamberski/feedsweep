import {
  composeQuery,
  getPathSegments,
  getQueryParam,
  isAnyOf,
  isPlainObject,
  trimObject,
} from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'donorbox'

const hosts = ['donorbox.org']

// Only `/embed/{slug}` is a form. The campaign page sits at `/{slug}` and is what the
// placeholder links to; the blog and event routes name nothing embeddable.
export const donorboxResolveEmbed: ResolveUrlEmbed = (url) => {
  const [kind, slug, ...rest] = getPathSegments(url)

  if (!isAnyOf(kind, 'embed') || !slug || rest.length > 0) {
    return
  }

  // The amount prefills the donation. The rest of the query is the form's look.
  const amount = getQueryParam(url.searchParams, 'amount')
  const query = composeQuery(trimObject({ amount }, Boolean))

  return {
    provider,
    id: slug,
    src: `https://donorbox.org/embed/${slug}${query}`,
    url: `https://donorbox.org/${slug}`,
  }
}

// Donorbox's donation form iframe, sized by a loader script that feeds strip.
export const donorboxEmbedResolver = createUrlEmbedResolver(hosts, donorboxResolveEmbed)

// The form posts its rendered height unasked, as `{ from: 'dbox', src, height }`, and answers a
// posted `{ action: 'please-resize-me' }` with the same message.
export const readDonorboxHeight = (data: unknown): number | undefined => {
  if (!isPlainObject(data) || data.from !== 'dbox') {
    return
  }

  return readPixels(data.height)
}

export const donorboxRenderHint: EmbedRenderHint = {
  provider,
  // Spelled out: a `www.` src 301s to the apex, so every message arrives from here.
  origin: 'https://donorbox.org',
  requestHeight: { action: 'please-resize-me' },
  readHeight: readDonorboxHeight,
}
