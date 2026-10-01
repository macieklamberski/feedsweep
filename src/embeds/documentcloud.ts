import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { EmbedRenderHint } from '../types.js'
import { readObjectHeight } from '../utils/hints.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'documentcloud'

const legacyHosts = ['www.documentcloud.org']

const documentcloudHosts = ['embed.documentcloud.org', ...legacyHosts]

// s3.documentcloud.org serves the page image under the slug in the exact case the path spells it.
const documentSegmentRegex = /^(\d+)-(.+?)(\.html)?$/
const partPathRegex = /^\/documents\/(\d+)\/(annotations|pages)\/([^/]+)\/?$/
const legacyNotePathRegex = /^\/documents\/(\d+)-[^/]+\/(annotations)\/([^/]+)\.html$/

// The embed host renders every route as an embed, so the `embed=1` the dialog writes restates it.
// See: https://github.com/MuckRock/documentcloud-frontend/blob/main/src/lib/utils/embed.ts.
const embedBaseUrl = 'https://embed.documentcloud.org/documents'

// DocumentCloud's viewer iframe, `embed.documentcloud.org/documents/{id}-{slug}/`, and the older
// `www.documentcloud.org/documents/{id}-{slug}.html`, which redirects to it. The carrier `title`
// is the document's own name with `" (Hosted by DocumentCloud)"` appended, so it is left unread.
export const documentcloudEmbedResolver = createUrlEmbedResolver(documentcloudHosts, (url) => {
  const parsed = parseUrl(url)

  if (!parsed) {
    return
  }

  const isLegacyHost = isHostOf(url, legacyHosts)
  const [route, documentSegment, partSegment] = getPathSegments(url)

  // A project id lands in the documents id space, so without this route check
  // `projects/2345-jail-records` mints another document's page image.
  if (route !== 'documents') {
    return
  }

  // A page or note embed, `documents/{id}/pages/{n}/` or `documents/{id}/annotations/{n}/`. The
  // legacy host writes a note as `documents/{id}-{slug}/annotations/{n}.html`, a path the embed
  // host answers with a 404.
  if (partSegment) {
    const partRegex = isLegacyHost ? legacyNotePathRegex : partPathRegex
    const partMatch = parsed.pathname.match(partRegex)

    if (!partMatch) {
      return
    }

    const [, id, part, number] = partMatch

    return {
      provider,
      id: `${id}/${part}/${number}`,
      src: `${embedBaseUrl}/${id}/${part}/${number}/`,
    }
  }

  const match = documentSegment?.match(documentSegmentRegex)

  if (!match) {
    return
  }

  const [, id, slug, htmlSuffix] = match

  // On www.documentcloud.org only the `.html` path redirects to the viewer. The bare segment is
  // the site's own document page, and `.pdf` redirects to the file an enclosure links to.
  if (isLegacyHost && !htmlSuffix) {
    return
  }

  return {
    provider,
    id,
    src: `${embedBaseUrl}/${id}-${slug}/`,
    thumbnail: `https://s3.documentcloud.org/documents/${id}/pages/${slug}-p1-normal.gif`,
    ratio: '17/22',
  }
})

// A page or note embed posts its rendered height unasked, as `{ width, height, href }`. The
// document viewer posts nothing.
export const documentcloudRenderHint: EmbedRenderHint = {
  provider,
  readHeight: readObjectHeight,
}
