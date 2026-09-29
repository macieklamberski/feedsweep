import { decodeSegment, getPathSegments, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { filterUrlQuery, isTrackingParam } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'observable'

const observableHosts = ['observablehq.com']

// Observable serves the hex id in lowercase only, and answers 404 to an uppercase spelling.
const notebookIdRegex = /^[0-9a-f]{16}$/
// Both segments are spliced into the notebook's page url, where a dot segment, `%2e` included,
// would resolve out of the notebook.
const handleRegex = /^@[^\s/?#]+$/
const notebookRegex = /^(?!(?:\.|%2e){1,2}$)[^\s/?#]+$/i
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
  // hands the rest to the notebook's own code, so all of it but the trackers is kept.
  parsed.search = filterUrlQuery(parsed, (name) => !isTrackingParam(name))
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

  const handle = keepIfMatches(decodeSegment(segments[1]), handleRegex)
  const slug = decodeSegment(segments[2])?.replace(versionSuffixRegex, '')
  const notebook = keepIfMatches(slug, notebookRegex)

  if (!handle || !notebook) {
    return
  }

  return {
    provider,
    id: `${handle}/${notebook}`,
    src,
    url: `https://observablehq.com/${handle}/${notebook}`,
  }
}

export const observableEmbedResolver = createUrlEmbedResolver(
  observableHosts,
  observableResolveEmbed,
)
