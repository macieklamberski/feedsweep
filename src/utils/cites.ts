import { type PartialNullish, trimString } from 'trousse'
import type { CiteResolverResult } from '../types.js'
import { isDeadHref } from './urls.js'

// What a resolver scrapes: the result fields as the markup or the JSON blob carries them,
// untrimmed and nullish wherever the field is absent.
type RawCiteResult = PartialNullish<CiteResolverResult> & Pick<CiteResolverResult, 'provider'>

export const buildCite = (result: RawCiteResult): CiteResolverResult | undefined => {
  const url = trimString(result.url)
  const title = trimString(result.title)

  // A card whose link goes nowhere cites nothing, as a WordPress post embed's `href="#"` shows.
  if (!url || !title || isDeadHref(url)) {
    return
  }

  return {
    provider: result.provider,
    url,
    title,
    description: trimString(result.description),
    caption: trimString(result.caption),
    author: trimString(result.author),
    publisher: trimString(result.publisher),
    date: trimString(result.date),
    icon: trimString(result.icon),
    thumbnail: trimString(result.thumbnail),
    kind: result.kind ?? undefined,
  }
}
