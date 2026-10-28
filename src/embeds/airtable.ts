import { getPathSegments, isAnyOf, isHostOf, isPlainObject } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'airtable'

// Exact: `static.airtable.com` serves the embed script and images.
const hosts = ['airtable.com']

// A shared view is `shr…` and its base `app…`. An interface page `pag…` and a table `tbl…`
// share the same path depth, and the server matches both prefixes case-sensitively.
const shareIdRegex = /^shr/
const baseIdRegex = /^app/
const pageIdRegex = /^pag/

const sizes = {
  // Airtable's snippet and oEmbed answer frame every view at 533.
  view: { height: 533 },
}

// `/embed/{shr}` from older snippets and `/embed/{app}/{shr}` from the current one. The bare form
// redirects to the base, which cannot be derived from the share.
const isSharedView = (ids: Array<string>): boolean => {
  if (ids.length > 2) {
    return false
  }

  const share = ids.at(-1)
  const base = ids.length === 2 ? ids[0] : undefined

  if (!share || !shareIdRegex.test(share)) {
    return false
  }

  return base === undefined || baseIdRegex.test(base)
}

// `/embed/{app}/{pag}/form`. The bare interface page answers 404 with `SAMEORIGIN` on the embed
// route, so only its form is a frame.
const isInterfaceForm = (ids: Array<string>): boolean => {
  const [base, page, view] = ids

  if (ids.length !== 3 || !base || !page) {
    return false
  }

  return baseIdRegex.test(base) && pageIdRegex.test(page) && isAnyOf(view, 'form')
}

// Airtable's embed frame: a shared view, or an interface form.
export const airtableResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, ...ids] = getPathSegments(url)

  if (!isAnyOf(route, 'embed')) {
    return
  }

  const isForm = isInterfaceForm(ids)

  if (!isSharedView(ids) && !isForm) {
    return
  }

  const path = ids.join('/')

  return {
    provider,
    // The page id names the interface, and `form` only the view the frame opens on it.
    id: isForm ? ids.slice(0, 2).join('/') : path,
    src: `https://airtable.com/embed/${path}`,
    url: `https://airtable.com/${path}`,
    ...sizes.view,
  }
}

export const airtableEmbedResolver = createUrlEmbedResolver(hosts, airtableResolveEmbed, {
  isOnHost: isHostOf,
})

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
