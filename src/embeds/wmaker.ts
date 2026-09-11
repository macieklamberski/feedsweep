import { parseUrl } from 'trousse'

// WMaker's Flash player addresses a video by a sha1 that appears nowhere else in the document, so
// the carrier's own id mints nothing. The article id does address the modern embed route, and the
// item permalink is the one place it is written.
const flashPathRegex = /\/v\/[0-9a-f]{40}\/?(?:[?#]|$)/i
// WMaker writes every article url as {slug}_a{id}.html.
const articleIdRegex = /_a(\d+)\.html?(?:[?#]|$)/i

// The `<object>` carries no class, no platform host and no distinguishing attribute, so a `/v/`
// path holding a 40-character sha1 is the whole discrimination. Loosening either half lets an
// unrelated Flash object through.
export const isFlashPlayerUrl = (url: string | undefined): boolean => {
  return url !== undefined && flashPathRegex.test(url)
}

// The modern player answers 200 with the article's video, and an empty 2,295-byte shell for an id
// that does not exist. A WMaker carrier always points at the publisher's own domain.
export const composeEmbedUrl = (permalink: string | undefined): string | undefined => {
  const id = permalink?.match(articleIdRegex)?.[1]
  const url = permalink ? parseUrl(permalink) : undefined

  if (!id || !url) {
    return
  }

  return `${url.origin}/embed/${id}/`
}
