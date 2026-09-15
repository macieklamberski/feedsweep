import { getPathSegments } from 'trousse'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const documentcloudHosts = ['embed.documentcloud.org']

// s3.documentcloud.org serves the page image under the slug in the exact case the path spells it.
const documentSegmentRegex = /^(\d+)-(.+)$/

// DocumentCloud's viewer iframe, `embed.documentcloud.org/documents/{id}-{slug}/`. The carrier
// `title` is the document's own name with `" (Hosted by DocumentCloud)"` appended, a suffix the
// platform localises, so the title is left to enrichment.
export const documentcloudEmbedResolver = createUrlEmbedResolver(documentcloudHosts, (url) => {
  const [route, documentSegment] = getPathSegments(url)

  // A project id lands in the documents id space, so without this route check
  // `projects/2345-jail-records` mints another document's page image.
  if (route !== 'documents') {
    return
  }

  const match = documentSegment?.match(documentSegmentRegex)

  if (!match) {
    return
  }

  const [, id, slug] = match

  return {
    provider: 'documentcloud',
    id,
    src: url,
    thumbnail: `https://s3.documentcloud.org/documents/${id}/pages/${slug}-p1-normal.gif`,
  }
})
