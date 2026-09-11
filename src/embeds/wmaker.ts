import { parseUrl } from 'trousse'

// WMaker is a French site builder whose Flash player addresses a video by a sha1 that appears
// nowhere else in the document, so the carrier's own id cannot be minted onto anything. The
// article id can: the platform's modern embed route takes it, and the item permalink is the one
// place it is written. That is why the repair is a transform and not a resolver, since only a
// transform is handed the permalink.
const flashPathRegex = /\/v\/[0-9a-f]{40}\/?(?:[?#]|$)/i

// WMaker writes every article url as {slug}_a{id}.html, which is the id its embed route takes.
const articleIdRegex = /_a(\d+)\.html?(?:[?#]|$)/i

// The `<object>` carries no class, no platform host and no distinguishing attribute, so the route
// shape is the whole discrimination: a `/v/` path holding a 40-character sha1. Loosening either
// half lets an unrelated Flash object through, and this transform replaces what it matches.
export const isFlashPlayerUrl = (url: string | undefined): boolean => {
  return url !== undefined && flashPathRegex.test(url)
}

// The modern player, which answers 200 with the article's video and returns an empty 2,295-byte
// shell for an id that does not exist. Composed against the permalink's own origin, because a
// WMaker carrier always points at the publisher's own domain.
export const composeEmbedUrl = (permalink: string | undefined): string | undefined => {
  const id = permalink?.match(articleIdRegex)?.[1]
  const url = permalink ? parseUrl(permalink) : undefined

  if (!id || !url) {
    return
  }

  return `${url.origin}/embed/${id}/`
}
