import { getPathSegments, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'googledocs'

const docRoute = 'pub'

// Each of these draws the same doc whether present or not, unlike `embedded`, which drops the
// published-by header.
const unseenParams = [
  'rm', // Minimal toolbar
]

const docHeight = 500

// `/document/d/e/{token}` names a doc published to the web and `/document/d/{id}` names it by
// its Drive file id.
export const googledocsResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url)
  const pathSegments = getPathSegments(url)

  if (!parsed || pathSegments[0] !== 'document' || pathSegments[1] !== 'd') {
    return
  }

  const isPublished = pathSegments[2] === 'e'
  const docId = pathSegments[isPublished ? 3 : 2]
  const route = pathSegments.slice(isPublished ? 4 : 3).join('/')

  if (route !== docRoute) {
    return
  }

  const docPath = isPublished ? `e/${docId}` : docId
  const query = filterUrlQuery(parsed, (name) => !unseenParams.includes(name))

  return {
    provider,
    id: docId,
    src: `https://docs.google.com/document/d/${docPath}/${docRoute}${query}`,
    url: `https://docs.google.com/document/d/${docPath}/${docRoute}`,
    height: docHeight,
    title: attr(element, 'title'),
  }
}

export const googledocsEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com'],
  googledocsResolveEmbed,
)
