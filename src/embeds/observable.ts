import { decodeSegment, getPathSegments, parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { readIframeResizeHeight } from '../utils/hints.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'observable'

const observableHosts = ['observablehq.com']

// Observable serves the hex id in lowercase only, and answers 404 to an uppercase spelling.
const notebookIdRegex = /^[0-9a-f]{16}$/
const versionSuffixRegex = /@[^@/]*$/

// Observable's notebook frame, observablehq.com/embed/@{user}/{notebook}[@{version}]?cells={names},
// or embed/{16 hex}[@{version}] for a notebook addressed by its id.
const observableResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url)
  const segments = getPathSegments(url)

  if (!parsed || segments[0] !== 'embed') {
    return
  }

  // The query names which cells the frame renders, in `cells` or a repeated `cell`, and the frame
  // hands the rest to the notebook's own code, so all of it is kept.
  const src = parsed.href

  // `@{version}` pins one revision of a notebook rather than naming another one, and the document
  // endpoint takes the notebook alone, so the suffix stays out of the id.
  const notebookId = keepIfMatches(segments[1]?.replace(versionSuffixRegex, ''), notebookIdRegex)

  if (notebookId) {
    return {
      provider,
      id: notebookId,
      src,
      url: `https://observablehq.com/d/${notebookId}`,
    }
  }

  const [, rawHandle, rawSlug] = segments

  if (!rawHandle || !rawSlug) {
    return
  }

  // The decoded names serve the `@` check and the key, and the written segments the page path.
  const handle = decodeSegment(rawHandle) ?? rawHandle
  const notebook = (decodeSegment(rawSlug) ?? rawSlug).replace(versionSuffixRegex, '')

  if (!handle.startsWith('@') || !notebook) {
    return
  }

  return {
    provider,
    id: `${handle}/${notebook}`,
    src,
    url: `https://observablehq.com/${rawHandle}/${rawSlug.replace(versionSuffixRegex, '')}`,
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
