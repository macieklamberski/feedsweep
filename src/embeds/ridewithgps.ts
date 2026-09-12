import { getPathSegments, parseUrl, toMap } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ridewithgps'

const ridewithgpsHosts = ['ridewithgps.com']

// The id is minted into a path, so a separator in it would let the feed choose the path.
const idRegex = /^\d+$/

// An event names its id in `eventId`, and Ride with GPS serves no static render under `/events`.
const embedKinds = toMap({
  route: { path: 'routes', idParam: 'id', hasThumbnail: true },
  trip: { path: 'trips', idParam: 'id', hasThumbnail: true },
  event: { path: 'events', idParam: 'eventId', hasThumbnail: false },
})

const kindsByPath = new Map(Array.from(embedKinds, ([kind, shape]) => [shape.path, kind]))

// Route, trip and event ids share one numeric grammar, so the kind rides in the id.
const composeEmbed = (
  kind: string,
  id: string | undefined,
  src: string,
): EmbedResolverResult | undefined => {
  const shape = embedKinds.get(kind)

  if (!shape || !id || !idRegex.test(id)) {
    return
  }

  const page = `https://ridewithgps.com/${shape.path}/${id}`

  return {
    provider,
    id: `${kind}/${id}`,
    src,
    url: page,
    ...(shape.hasThumbnail ? { thumbnail: `${page}/thumb.png` } : undefined),
  }
}

// `ridewithgps.com/embeds?type={route|trip|event}`, the id in the parameter its kind names.
const readQueryEmbed = (parsed: URL): EmbedResolverResult | undefined => {
  const kind = parsed.searchParams.get('type') ?? ''
  const shape = embedKinds.get(kind)

  if (!shape) {
    return
  }

  const id = parsed.searchParams.get(shape.idParam) ?? ''

  // privacyCode is the share token of a non-public trip or event, so it names the resource.
  const params = new URLSearchParams({
    type: kind,
    [shape.idParam]: id,
    ...pickQueryParams(parsed.search, ['privacyCode']),
  })

  return composeEmbed(kind, id, `https://ridewithgps.com/embeds?${params}`)
}

// The older per-resource spelling, `ridewithgps.com/{routes|trips}/{id}/embed`, which feeds
// carry protocol-relative.
const readPathEmbed = (parsed: URL, url: string): EmbedResolverResult | undefined => {
  const [path, id, marker] = getPathSegments(parsed)

  if (marker !== 'embed') {
    return
  }

  const kind = kindsByPath.get(path ?? '')

  return kind ? composeEmbed(kind, id, url) : undefined
}

const ridewithgpsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  return parsed && (readQueryEmbed(parsed) ?? readPathEmbed(parsed, url))
}

// The Ride with GPS route map iframe, in both its query and its path spelling.
export const ridewithgpsEmbedResolver = createUrlEmbedResolver(
  ridewithgpsHosts,
  ridewithgpsResolveEmbed,
)
