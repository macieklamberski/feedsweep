import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { decodeOrKeep, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'observable'

const observableHosts = ['observablehq.com']

// `d/{id}` is Observable's other embed route and a different id space: the document endpoint the
// id addresses answers for `@{user}/{notebook}` alone. The rest of the class is mint safety, since
// both segments are spliced into the notebook's page url.
const handleRegex = /^@[^\s/?#]+$/
const notebookRegex = /^[^\s/?#]+$/
const versionSuffixRegex = /@[^@/]*$/

// Observable's notebook frame, observablehq.com/embed/@{user}/{notebook}[@{version}]?cells={names}.
const observableResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, observableHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)
  const handle = keepIfMatches(decodeOrKeep(segments[1]), handleRegex)
  // `@{version}` pins one revision of a notebook rather than naming another one, and the document
  // endpoint takes the notebook alone, so the suffix stays out of the id.
  const notebook = decodeOrKeep(segments[2])?.replace(versionSuffixRegex, '')
  const slug = keepIfMatches(notebook, notebookRegex)

  if (segments[0] !== 'embed' || !handle || !slug) {
    return
  }

  return {
    provider,
    id: `${handle}/${slug}`,
    // The query names which cells the frame renders, so the publisher's url is carried as written.
    // Rebuilt from the id alone the frame draws the whole notebook instead of the chosen chart.
    src: url,
    url: `https://observablehq.com/${handle}/${slug}`,
  }
}

export const observableEmbedResolver = createUrlEmbedResolver(
  observableHosts,
  observableResolveEmbed,
)
