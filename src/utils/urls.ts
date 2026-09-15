import { isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import type { AssetType, ResolveUrlFn, TransformContext, UrlRole } from '../types.js'

// Each helper names the slice of the context it actually reads, so a caller holding only a
// cleaner can still reach the cleaning step, and a whole context satisfies either one.
type ResolveContext = Pick<TransformContext, 'resolveUrlFn' | 'baseUrl'>
type CleanContext = Pick<TransformContext, 'cleanUrlFn'>

// A url read out of a query value or a JSON attribute often names no host of its own.
export const placeholderBaseUrl = 'https://example.com'

const urlShapeRegex = /[:/.]/
const queryOrHashRegex = /[?#]/

// Protocol-relative `//host/path` is left unmatched, so it resolves to the base url's scheme.
export const absoluteUrlRegex = /^[a-z][a-z0-9+.-]*:/i

// No m3u8 or mpd: only Safari plays them natively, so promoting one breaks the player elsewhere.
export const imageFileRegex = /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i
export const videoFileRegex = /\.(mp4|m4v|webm|mov|ogv)(\?|#|$)/i
export const audioFileRegex = /\.(aac|mp3|m4a|ogg|oga|wav|flac|opus)(\?|#|$)/i

// A file no browser can play. Flash was blocked everywhere in January 2021, and hosts still
// serve the `.swf` bytes, so a URL that reaches this is one that answers 200 and renders
// nothing whatever a reader does with it.
export const flashFileRegex = /\.swf(\?|#|$)/i

export const documentFileRegex = /\.(pdf|epub|docx?|pptx?|xlsx?)(\?|#|$)/i

// Whether a url names audio or video the reader can play as it stands. A podcast host serves the
// episode file from the same domain as its player, so a media url that skips this check reads as
// a player id and the enclosure loses its audio element to a placeholder.
export const isMediaFile = (value: string): boolean => {
  return audioFileRegex.test(value) || videoFileRegex.test(value)
}

// Whether a value names a file of any kind the reader can already show. The enclosure probe offers
// every attachment a feed carries to every resolver, so a platform whose id shape admits a dot
// would otherwise mint a player for an `.mp3` and take the place of a playable element.
export const isFileName = (value: string): boolean => {
  return (
    documentFileRegex.test(value) ||
    audioFileRegex.test(value) ||
    videoFileRegex.test(value) ||
    imageFileRegex.test(value)
  )
}

// A MediaWiki file page sits at `/wiki/File:Clip.webm`, so its path ends in the media's own
// extension while the response is HTML. Feeds carry the colon percent-encoded too, and the
// `/w/index.php?title=File:Clip.webm` spelling moves the namespace into the query.
const filePagePathRegex = /\/wiki\/[^/?#]*(?::|%3A)[^/?#]*$/i
const scriptPathRegex = /\/index\.php$/
const titleParamRegex = /[?&]title=[^&#]*(?::|%3A)/i
const filePageNameRegex = /\/wiki\/[^/?#]*?(?::|%3A)([^/?#]+)$/i

export const isMediaWikiFilePage = (value: string): boolean => {
  const path = value.split(queryOrHashRegex)[0]

  return filePagePathRegex.test(path) || (scriptPathRegex.test(path) && titleParamRegex.test(value))
}

// The name as the wiki spells it, percent-encoding intact, which is the form `Special:FilePath`
// and the API both take. Only the `/wiki/` spelling, since no feed carries the other on a frame.
export const parseMediaWikiFileName = (value: string): string | undefined => {
  return value.split(queryOrHashRegex)[0].match(filePageNameRegex)?.[1]
}

// Exact on purpose: Simplecast tells a current id from a legacy eight-hex one by this shape.
export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// One attribute carrying one url, on one element. The two passes that act on a url by its element
// and attribute, neutralizeUnsafeUrls and proxyAssetUrls, filter the table below for their own
// list, so an attribute is declared once and neither can quietly fall behind the other.
//
// Two passes and no more. resolveRelativeUrls stays out because it asks nothing of the tag: it
// matches `src` on any element at all, which several widget resolvers rely on to reach a
// `script[src]` carrier, and it keeps its own list. `srcset` stays out because it is not one url
// but a list of them: both passes rewrite the whole attribute, and each does so on terms this
// table cannot state, neutralizeUnsafeUrls dropping the unsafe candidates and proxyAssetUrls
// rewriting only when the proxy changed one.
export type UrlAttribute = {
  // Element carrying the attribute. Absent where any element can carry it: an embed or cite
  // placeholder parks its urls on data-* attributes of whatever element it replaced.
  tag?: string
  attribute: string
  // Safety class of the value, which picks the sentinel neutralizeUnsafeUrls swaps an unsafe
  // url for.
  role: UrlRole
  // Kind of asset proxyAssetUrls hands to the caller's proxy, absent where the value is not an
  // asset a proxy can serve. This is the only place that distinction is written down.
  //
  // `fromParent` is not a kind but the instruction to go and find one: a <source> or <track> is a
  // video track inside a <video> and an audio one inside an <audio>, so nothing about the row
  // itself can answer, and only the pass, holding the element, can.
  asset?: AssetType | 'fromParent'
}

// The url-carrying attributes of the two passes. The tag-less rows come first: they are the embed
// and cite placeholder attributes, which sit on whatever element the placeholder replaced, so a
// pass reads them on every element it visits.
export const urlAttributes: Array<UrlAttribute> = [
  { attribute: 'data-embed-url', role: 'link' },
  { attribute: 'data-cite-url', role: 'link' },
  { attribute: 'formaction', role: 'link' },
  { attribute: 'data-embed-src', role: 'media' },
  { attribute: 'data-embed-thumbnail', role: 'media', asset: 'image' },
  { attribute: 'data-embed-avatar', role: 'media', asset: 'image' },
  { attribute: 'data-cite-icon', role: 'media', asset: 'image' },
  { attribute: 'data-cite-thumbnail', role: 'media', asset: 'image' },
  { tag: 'a', attribute: 'href', role: 'link' },
  { tag: 'form', attribute: 'action', role: 'link' },
  { tag: 'img', attribute: 'src', role: 'media', asset: 'image' },
  { tag: 'video', attribute: 'src', role: 'media', asset: 'video' },
  { tag: 'video', attribute: 'poster', role: 'media', asset: 'image' },
  { tag: 'audio', attribute: 'src', role: 'media', asset: 'audio' },
  { tag: 'source', attribute: 'src', role: 'media', asset: 'fromParent' },
  { tag: 'track', attribute: 'src', role: 'media', asset: 'fromParent' },
  { tag: 'iframe', attribute: 'src', role: 'media' },
  { tag: 'embed', attribute: 'src', role: 'media' },
  { tag: 'object', attribute: 'data', role: 'media' },
  { tag: 'image', attribute: 'href', role: 'media', asset: 'image' },
]

// Keys the rows that name a tag by that tag, so a pass walking the DOM looks up an element's
// attributes by its local name instead of scanning the table. Tag-less rows are left out; a
// pass reads those on every element and filters for them separately.
export const groupUrlAttributesByTag = <Attribute extends UrlAttribute>(
  attributes: ReadonlyArray<Attribute>,
): ReadonlyMap<string, Array<Attribute>> => {
  const grouped = new Map<string, Array<Attribute>>()

  for (const attribute of attributes) {
    if (attribute.tag) {
      grouped.set(attribute.tag, [...(grouped.get(attribute.tag) ?? []), attribute])
    }
  }

  return grouped
}

// A real, loadable src, not empty and not the `about:blank` lazy placeholder.
export const isUsableSrc = (src: string | null): src is string => {
  const trimmed = src?.trim()

  return !!trimmed && trimmed !== 'about:blank'
}

// Rejects flag-style values like `"1"` / `"true"` / `"loaded"` that some lazy-loading
// libraries park on otherwise-lazy attribute names. A real URL carries a `:`, `/`, or `.`.
export const isUrlShaped = (value: string): boolean => {
  return urlShapeRegex.test(value)
}

// A url sits on one of the hosts when it is that host exactly or a subdomain of it. The pair is
// the whole question every host-keyed resolver asks, and half of it silently claims too little.
export const isOnHosts = (url: string | URL, hosts: string | ReadonlyArray<string>): boolean => {
  return isHostOf(url, hosts) || isSubdomainOf(url, hosts)
}

export const parseUrlOnHosts = (
  url: string | undefined,
  hosts: string | ReadonlyArray<string>,
): URL | undefined => {
  const parsed = url ? parseUrl(url, placeholderBaseUrl) : undefined

  if (parsed && isOnHosts(parsed, hosts)) {
    return parsed
  }
}

// A path segment arrives percent-encoded, unlike a query value, which `searchParams` decodes.
export const decodeSegment = (segment: string | undefined): string | undefined => {
  try {
    return segment === undefined ? undefined : decodeURIComponent(segment)
  } catch {}
}

// Decodes a percent-encoded value, handing back the raw text when the escape is malformed, for a
// field the undecoded form still reads as. A falsy value returns undefined, since
// decodeURIComponent answers the string "undefined" for a missing one.
export const decodeOrKeep = (value: string | undefined): string | undefined => {
  if (!value) {
    return
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

// A Flash-era player took its options as `{id}&autoplay=1` with no `?`, so they share a segment.
export const splitStrayParams = (segment: string): { head: string; strayParams: string } => {
  const [head = '', ...rest] = segment.split('&')

  return { head, strayParams: rest.join('&') }
}

// The same pick as `pickUrlParams`, for a query that arrives on its own, not on a url, which is
// how a facade states its player options (`lite-youtube`'s `params`). Returns the pairs instead
// of a string, so a caller can override one from a dedicated attribute before building.
export const pickQueryParams = (
  query: string,
  names: ReadonlyArray<string>,
): Record<string, string> => {
  const parsed = new URLSearchParams(query)
  const picked: Record<string, string> = {}

  for (const name of names) {
    const value = parsed.get(name)

    if (value) {
      picked[name] = value
    }
  }

  return picked
}

// The other half of `pickQueryParams`: the pairs it returns, back into a query ready to append.
// A resolver that has nothing to carry over gets an empty string, so its src stays bare rather
// than ending on a lone `?`.
export const composeQuery = (params?: Record<string, string>): string => {
  const query = new URLSearchParams(params).toString()

  return query ? `?${query}` : ''
}

// The query string an embed resolver carries over when it rebuilds a src from the video id:
// only the parameters that change what plays. Returns it ready to append, so a src with
// nothing worth keeping stays bare.
export const pickUrlParams = (url: string, names: ReadonlyArray<string>): string => {
  return composeQuery(pickQueryParams(parseUrl(url)?.search ?? '', names))
}

// Overloaded so a definite URL returns a string, with no undefined fallback needed at the call
// site. Only a possibly-undefined input widens the result.
type ResolveOrKeepUrl = {
  (url: string, context: ResolveContext): string
  (url: string | undefined, context: ResolveContext): string | undefined
}

export const resolveOrKeepUrl: ResolveOrKeepUrl = ((url, context: ResolveContext) => {
  if (!url || absoluteUrlRegex.test(url)) {
    return url || undefined
  }

  return context.resolveUrlFn(url, context.baseUrl) ?? url
}) as ResolveOrKeepUrl

// Untrimmed, a whitespace-only url resolves to the base url itself.
export const resolveOrDropUrl = (
  url: string | undefined,
  context: ResolveContext,
): string | undefined => {
  const trimmed = url?.trim()

  return trimmed ? context.resolveUrlFn(trimmed, context.baseUrl) : undefined
}

// Overloaded the same way and for the same reason as resolveOrKeepUrl: cleaning a definite url
// answers with a definite one, so composing the two keeps whichever answer the resolve step gave.
type CleanUrl = {
  (url: string, context: CleanContext): string
  (url: string | undefined, context: CleanContext): string | undefined
}

export const cleanUrl: CleanUrl = ((url, context: CleanContext) => {
  return url ? context.cleanUrlFn?.(url) || url : undefined
}) as CleanUrl

export const isSamePage = (
  href: string,
  baseUrl: string | undefined,
  resolveUrlFn: ResolveUrlFn,
): boolean => {
  if (href.startsWith('#')) {
    return true
  }

  if (!baseUrl) {
    return false
  }

  const resolvedHref = resolveUrlFn(href, baseUrl)
  const resolvedBase = resolveUrlFn(baseUrl, undefined)

  if (!resolvedHref || !resolvedBase) {
    return false
  }

  const target = parseUrl(resolvedHref)
  const base = parseUrl(resolvedBase)

  if (!target || !base) {
    return false
  }

  return target.origin === base.origin && target.pathname === base.pathname
}
