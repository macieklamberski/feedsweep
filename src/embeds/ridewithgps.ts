import { decodeSegment, getPathSegments, parseUrl, toMap } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import {
  composeQuery,
  encodePathSegment,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

type EmbedShape = {
  path: string
  idParam: string
  hasThumbnail: boolean
}

const provider = 'ridewithgps'

const ridewithgpsHosts = ['ridewithgps.com']

const embedParams = ['title', 'privacyCode']

// An event names its id in `eventId`, and Ride with GPS serves no static render under `/events`.
const embedKinds = toMap<EmbedShape>({
  route: { path: 'routes', idParam: 'id', hasThumbnail: true },
  trip: { path: 'trips', idParam: 'id', hasThumbnail: true },
  event: { path: 'events', idParam: 'eventId', hasThumbnail: false },
})

// Ride with GPS answers 404 on `/events/{id}/embed`.
const kindsByPath = toMap({ routes: 'route', trips: 'trip' })

const composeSource = (
  kind: string,
  shape: EmbedShape,
  id: string,
  params?: Record<string, string>,
): string => {
  return `https://ridewithgps.com/embeds${composeQuery({ type: kind, [shape.idParam]: id, ...params })}`
}

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
    title,
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

  if (!id) {
    return
  }

  // `title` is the heading the player draws over the map in place of the route's own name.
  const { title, ...playerParams } = pickQueryParams(parsed.search, embedParams)
  const src = composeSource(kind, shape, id, playerParams)

  // A private resource's page and thumbnail answer 403 without its token.
  if (playerParams.privacyCode) {
    return {
      provider,
      id: `${kind}/${id}`,
      src,
      title,
    }
  }

  // The id comes out of the query decoded, and the page goes into a path beside the raw spelling.
  return composeEmbed(kind, shape, encodePathSegment(id), src, title)
}

// The older per-resource spelling, `ridewithgps.com/{routes|trips}/{id}/embed`, which feeds
// carry protocol-relative. Ride with GPS redirects it to the query spelling.
const readPathEmbed = (parsed: URL): EmbedResolverResult | undefined => {
  const segments = getPathSegments(parsed)
  const [path, id, marker] = segments

  if (segments.length !== 3 || marker !== 'embed' || !id) {
    return
  }

  const kind = kindsByPath.get(path ?? '')
  const shape = embedKinds.get(kind ?? '')

  if (!kind || !shape) {
    return
  }

  return composeEmbed(kind, shape, id, composeSource(kind, shape, decodeSegment(id) ?? id))
}

const ridewithgpsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  return parsed && (readQueryEmbed(parsed) ?? readPathEmbed(parsed))
}

// The Ride with GPS route map iframe, in both its query and its path spelling.
export const ridewithgpsEmbedResolver = createUrlEmbedResolver(
  ridewithgpsHosts,
  ridewithgpsResolveEmbed,
)
