import { getPathSegments, parseUrl, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'
import { composeDriveThumbnail } from './googledrive.js'

const provider = 'googledocs'

// Each route the resolver reads, with the parameters dropped from the frame. `embedded` stays,
// since it drops the published-by header on `/pub`. A doc shared by link is framed on `/preview`
// by its file id, and most such docs answer 401 on `/pub`. An `/edit` carrier is a pasted share
// link that draws the editor's chrome, so it is framed on `/preview` too, where `rm` has nothing
// left to remove.
const docRoutes = toMap({
  edit: [
    'rm', // Minimal toolbar
    'usp', // Share link tracker
  ],
  preview: [
    'usp', // Share link tracker
  ],
  pub: [
    'rm', // Minimal toolbar
  ],
})

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
  const unseenParams = docRoutes.get(route)
  const isShared = route !== 'pub'

  // A publish token answers 404 on `/edit` and `/preview`.
  if (!unseenParams || (isPublished && isShared)) {
    return
  }

  const docPath = isPublished ? `e/${docId}` : docId
  const query = filterUrlQuery(parsed, (name) => !unseenParams.includes(name))

  return {
    provider,
    id: docId,
    src: `https://docs.google.com/document/d/${docPath}/${isShared ? 'preview' : 'pub'}${query}`,
    // `/edit` is the page of a doc shared by link.
    url: `https://docs.google.com/document/d/${docPath}/${isShared ? 'edit' : 'pub'}`,
    thumbnail: isShared ? composeDriveThumbnail(docId) : undefined,
    height: docHeight,
    title: attr(element, 'title'),
  }
}

export const googledocsEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com'],
  googledocsResolveEmbed,
)
