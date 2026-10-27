import { getPathSegments, isAnyOf, toMap } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'wistia'

// The script form names the media through a JSONP callback, with no page in the url.
const jsonpSuffixRegex = /\.jsonp$/i

const hosts = ['wistia.net', 'wistia.com']

// Both spellings ship: channel on the player host and channels on the account host.
// A channel has no vanity slug anywhere in the url space: the segment is the same hashed id every
// route shares.
const playerRoutes = toMap({
  iframe: 'iframe',
  medias: 'iframe',
  channel: 'channel',
  channels: 'channel',
  playlists: 'playlists',
})

const sizes = {
  player: { ratio: '16/9' },
}

// The iframe route answers 200 with an error body for a channel id, so the route has to match.
// The body is a bare `{"error":true,"iframe":true}`, so the status code says nothing.
export const composeEmbedUrl = (route: string, mediaId: string): string => {
  return `https://fast.wistia.net/embed/${route}/${mediaId}`
}

export const extractWistiaEmbed = (
  link: URL,
): { route: string; id: string; page?: string } | undefined => {
  const segments = getPathSegments(link)
  const [root] = segments
  const [named = '', media] = isAnyOf(root, 'embed') ? segments.slice(1) : segments
  const route = playerRoutes.get(named.toLowerCase())
  const id = media?.replace(jsonpSuffixRegex, '')

  // A dot marks a file such as the media JSON, and no route serves a file as a player.
  if (!route || !id || id.includes('.')) {
    return
  }

  // Only the account host serves /medias/{id}: the player hosts 404 on it.
  const host = isAnyOf(root, 'medias') ? parseUrlOnHosts(link, hosts)?.hostname : undefined

  return { route, id, page: host ? `https://${host}/medias/${id}` : undefined }
}

// The media a `src` names, for the carriers the factory never sees: a `<script>` and an `<iframe>`
// are matched on a substring of their path, so the host is the only thing telling Wistia's own
// `/embed/medias/{id}` from a foreign path that spells it.
export const readSrcMediaId = (src: string | undefined): string | undefined => {
  const url = parseUrlOnHosts(src, hosts)

  if (!url) {
    return
  }

  return extractWistiaEmbed(url)?.id
}

// No thumbnail: the poster needs Wistia's media JSON hop.
export const wistiaResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const embed = extractWistiaEmbed(url)

  if (!embed) {
    return
  }

  // A media keeps the bare id it has always carried. The other two qualify it, because the three
  // share one id grammar and enrichment receives the provider and the id alone.
  return {
    provider,
    id: embed.route === 'iframe' ? embed.id : `${embed.route}/${embed.id}`,
    src: composeEmbedUrl(embed.route, embed.id),
    url: embed.page,
    ...sizes.player,
    // Wistia's own snippet writes the media's name here with the word `Video` appended.
    title: element ? attr(element, 'title') : undefined,
  }
}

// A Wistia media, channel or playlist player iframe, or a frame of the login-gated channel page.
export const wistiaEmbedResolver = createUrlEmbedResolver(hosts, wistiaResolveEmbed)

export const wistiaFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Wistia video player' },
]

// Starts playback on the click that loads the player: the iframe copies every query entry into
// its embed options. Never `silentAutoPlay=true`, which forces a muted start.
export const wistiaRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoPlay: 'true' },
}
