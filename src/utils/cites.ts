import { getPathSegments, isString, type Nullish, type PartialNullish, parseUrl } from 'trousse'
import type { CiteResolverResult } from '../types.js'
import { attr } from './dom.js'
import { placeholderBaseUrl } from './urls.js'

// What a resolver scrapes: the result fields as the markup or the JSON blob carries them,
// untrimmed and nullish wherever the field is absent.
type RawCiteResult = PartialNullish<CiteResolverResult> & Pick<CiteResolverResult, 'provider'>

// A JSON payload can carry a number, an array or an object where the card has text.
export const trim = (value: unknown): string | undefined => {
  if (!isString(value)) {
    return
  }

  return value.trim() || undefined
}

// A byline links the author or the publisher at `/{handle}`, relative on a self-hosted card and
// absolute on a cross-posted one.
export const readLinkHandle = (anchor: Nullish<Element>): string | undefined => {
  const page = parseUrl(attr(anchor, 'href'), placeholderBaseUrl)

  if (!page) {
    return
  }

  const [handle] = getPathSegments(page)

  return handle
}

export const buildCite = (result: RawCiteResult): CiteResolverResult | undefined => {
  const url = trim(result.url)
  const title = trim(result.title)

  if (!url || !title) {
    return
  }

  return {
    provider: result.provider,
    url,
    title,
    description: trim(result.description),
    caption: trim(result.caption),
    author: trim(result.author),
    publisher: trim(result.publisher),
    date: trim(result.date),
    icon: trim(result.icon),
    thumbnail: trim(result.thumbnail),
    kind: result.kind ?? undefined,
  }
}
