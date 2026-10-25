import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { readIframeResizeHeight } from '../utils/hints.js'
import { hexRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'observable'

const observableHosts = ['observablehq.com']

const versionSuffixRegex = /@[^@/]*$/

// Observable's notebook frame, observablehq.com/embed/@{user}/{notebook}[@{version}]?cells={names},
// or embed/{16 hex}[@{version}] for a notebook addressed by its id.
const observableResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const segments = getPathSegments(url)

  if (!isAnyOf(segments[0], 'embed')) {
    return
  }

  // The query names which cells the frame renders, in `cells` or a repeated `cell`, and the frame
  // hands the rest to the notebook's own code, so all of it is kept.
  const src = url.href

  // `@{version}` pins one revision of a notebook rather than naming another one, and the document
  // endpoint takes the notebook alone, so the suffix stays out of the id.
  // A notebook id is the only segment after `embed`, and `embed/d/{id}` answers 404.
  const notebookId =
    segments.length === 2
      ? keepIfMatches(segments[1].replace(versionSuffixRegex, ''), hexRegex)
      : undefined

  if (notebookId) {
    return {
      provider,
      id: notebookId,
      src,
      url: `https://observablehq.com/d/${notebookId}`,
      title: attr(element, 'title'),
    }
  }

  const [, rawHandle, rawSlug] = segments

  if (!rawHandle || !rawSlug) {
    return
  }

  const notebook = rawSlug.replace(versionSuffixRegex, '')

  if (!rawHandle.startsWith('@') || !notebook) {
    return
  }

  return {
    provider,
    id: `${rawHandle}/${notebook}`,
    src,
    url: `https://observablehq.com/${rawHandle}/${notebook}`,
    title: attr(element, 'title'),
  }
}

export const observableEmbedResolver = createUrlEmbedResolver(
  observableHosts,
  observableResolveEmbed,
)

// The notebook posts its rendered height unasked, again as each cell finishes.
export const observableRenderHint: EmbedRenderHint = {
  provider,
  // Spelled out: `observablehq.com/embed/` redirects to `old.observablehq.com`, so every message
  // arrives from there.
  origin: 'https://old.observablehq.com',
  readHeight: readIframeResizeHeight,
}
