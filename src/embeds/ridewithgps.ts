import { getPathSegments, parseUrl, toMap, trimObject } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

type EmbedShape = {
  path: string
  idParam: string
  hasThumbnail: boolean
}

const provider = 'ridewithgps'

const ridewithgpsHosts = ['ridewithgps.com']

const embedParams = [
  'title',
  'overlay',
  'metricUnits',
  'sampleGraph',
  'distanceMarkers',
  'privacyCode',
]

// The id is minted into a path, so a separator in it would let the feed choose the path.
const idRegex = /^\d+$/

// An event names its id in `eventId`, and Ride with GPS serves no static render under `/events`.
const embedKinds = toMap<EmbedShape>({
  route: { path: 'routes', idParam: 'id', hasThumbnail: true },
  trip: { path: 'trips', idParam: 'id', hasThumbnail: true },
  event: { path: 'events', idParam: 'eventId', hasThumbnail: false },
})

// Ride with GPS answers 404 on `/events/{id}/embed`.
const kindsByPath = toMap({ routes: 'route', trips: 'trip' })

// Route, trip and event ids share one numeric grammar, so the kind rides in the id.
const composeEmbed = (
  kind: string,
  shape: EmbedShape,
  id: string,
  src: string,
  title?: string,
): EmbedResolverResult => {
  const page = `https://ridewithgps.com/${shape.path}/${id}`

  return {
    provider,
    id: `${kind}/${id}`,
    src,
    url: page,
    ...(shape.hasThumbnail ? { thumbnail: `${page}/thumb.png` } : undefined),
    ...trimObject({ title }, Boolean),
  }
}

// `ridewithgps.com/embeds?type={route|trip|event}`, the id in the parameter its kind names.
const readQueryEmbed = (parsed: URL): EmbedResolverResult | undefined => {
  const kind = parsed.searchParams.get('type') ?? ''
  const shape = embedKinds.get(kind)

  if (parsed.pathname !== '/embeds' || !shape) {
    return
  }

  const id = parsed.searchParams.get(shape.idParam)

  if (!id || !idRegex.test(id)) {
    return
  }

  const params = pickQueryParams(parsed.search, embedParams)
  const query = composeQuery({ type: kind, [shape.idParam]: id, ...params })
  const src = `https://ridewithgps.com/embeds${query}`

  // A private resource's page and thumbnail answer 403 without its token.
  if (params.privacyCode) {
    return {
      provider,
      id: `${kind}/${id}`,
      src,
      ...trimObject({ title: params.title }, Boolean),
    }
  }

  return composeEmbed(kind, shape, id, src, params.title)
}

// The older per-resource spelling, `ridewithgps.com/{routes|trips}/{id}/embed`, which feeds
// carry protocol-relative.
const readPathEmbed = (parsed: URL, url: string): EmbedResolverResult | undefined => {
  const segments = getPathSegments(parsed)
  const [path, id, marker] = segments

  if (segments.length !== 3 || marker !== 'embed' || !id || !idRegex.test(id)) {
    return
  }

  const kind = kindsByPath.get(path ?? '')
  const shape = embedKinds.get(kind ?? '')

  if (!kind || !shape) {
    return
  }

  return composeEmbed(kind, shape, id, url)
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
