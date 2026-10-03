import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, findConfigScript } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const fileExtensionRegex = /\.[a-z]+$/i

const jwplayerHosts = ['jwplayer.com', 'jwplatform.com']
const libraryHosts = ['jwplatform.com', 'jwpsrv.com']

// `players` is the embed and `previews` its share page, and both serve the same player for the
// same id, 404 for a fabricated one. `cdn.jwplayer.com/videos/{id}-1280.mp4` is an enclosure.
const playerRoutes = ['players', 'previews']

export const extractJwplayerId = (link: string): string | undefined => {
  const [route, lastSegment] = getPathSegments(link).slice(-2)

  if (!lastSegment || !isAnyOf(route ?? '', playerRoutes)) {
    return
  }

  // Embed URLs end in `{mediaId}-{playerId}.html`. The media id is the part before the
  // first dash, with the file extension dropped.
  return lastSegment.replace(fileExtensionRegex, '').split('-')[0]
}

// The poster endpoint answers about a media and 404s for anything else, so a playlist id must
// not reach it. AMP's own component applies the same rule, rendering a placeholder image only
// when the element names a media.
const composeJwplayerEmbed = (id: string, isPlaylist = false): EmbedResolverResult => {
  return {
    provider: 'jwplayer',
    id: isPlaylist ? `playlist/${id}` : id,
    // Rebuilt from the id, so the empty player-id segment some feeds ship
    // (`{mediaId}-.html`, which 404s) is dropped and the URL loads the default player.
    // JW Player has no public watch page, so no `url`: the placeholder anchors to the src.
    src: `https://cdn.jwplayer.com/players/${id}.html`,
    // A playlist id 404s on the poster endpoint, so the thumbnail is gated on the kind.
    ...(!isPlaylist && { thumbnail: `https://cdn.jwplayer.com/v2/media/${id}/poster.jpg` }),
    ratio: '16/9',
  }
}

export const jwplayerResolveEmbed: ResolveEmbed = (url) => {
  const mediaId = extractJwplayerId(url)

  if (!mediaId) {
    return
  }

  return composeJwplayerEmbed(mediaId)
}

// A JW Player iframe, players/{mediaId}-{playerId}.html, some with an empty player id that 404s.
export const jwplayerIframeEmbedResolver = createUrlEmbedResolver(
  jwplayerHosts,
  jwplayerResolveEmbed,
)

// JW Player's script embed: the same players/{mediaId}-{playerId} url beside an empty botr_ div.
export const jwplayerScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="jwplayer.com/players/"], script[src*="jwplatform.com/players/"]',
  (element) => {
    const src = attr(element, 'src') ?? ''

    if (!parseUrlOnHosts(src, jwplayerHosts)) {
      return
    }

    return jwplayerResolveEmbed(src)
  },
)

// AMP's amp-jwplayer element, which renders nothing without the AMP runtime.
// The player id in `data-player-id` only picks a skin, and AMP's own builder gives
// `data-playlist-id` precedence over the media id when both are present.
export const jwplayerAmpEmbedResolver = createMarkupEmbedResolver(
  'amp-jwplayer[data-media-id], amp-jwplayer[data-playlist-id]',
  (element) => {
    const playlistId = attr(element, 'data-playlist-id')
    const id = playlistId ?? attr(element, 'data-media-id')

    if (!id) {
      return
    }

    return composeJwplayerEmbed(id, !!playlistId)
  },
)

// The setup object points its playlist at `cdn.jwplayer.com/v2/media/{mediaId}`, or at the
// legacy `content.jwplatform.com/feeds/{mediaId}.json`, `jw6/{mediaId}.xml` or
// `feed/{mediaId}.rss`, also on `jwpsrv.com`, `/` often escaped.
const setupPlaylistRegex =
  /(?:jwplayer|jwplatform|jwpsrv)\.com\\?\/(?:v2\\?\/media|feeds?|jw6)\\?\/([^\\/."'?]+)/
const setupMountRegex = /jwplayer\(\s*["']([^"']+)["']\s*\)/

// An empty div.jwplayer beside an inline jwplayer(...).setup() call, stripped as an empty tag.
export const jwplayerSetupEmbedResolver = createMarkupEmbedResolver('div.jwplayer', (element) => {
  const config = findConfigScript(element)?.textContent
  const mediaId = config?.match(setupPlaylistRegex)?.[1]

  if (!mediaId) {
    return
  }

  return composeJwplayerEmbed(mediaId)
})

// The paragraph pass can wrap the loader, the mount or the setup call in a <p> of its own.
const findSnippetSibling = (
  element: Element | undefined,
  side: 'previousElementSibling' | 'nextElementSibling',
): Element | undefined => {
  if (!element) {
    return
  }

  const sibling = element[side]

  if (sibling) {
    return sibling
  }

  if (element.parentElement?.localName !== 'p') {
    return
  }

  return element.parentElement[side] ?? undefined
}

const findScript = (element: Element | undefined): Element | undefined => {
  if (element?.localName === 'script') {
    return element
  }

  return element?.querySelector('script') ?? undefined
}

// The jwppp plugin wraps its snippet in a schema.org VideoObject box. Its `data-video` often says
// `1`, so only a `contentUrl` naming the same media ties the box to the player.
const readJwpppBox = (element: Element, mediaId: string): Partial<EmbedResolverResult> => {
  const parent = element.parentElement
  const box = parent?.localName === 'p' ? parent.parentElement : parent

  const readMeta = (name: string): string | undefined => {
    return attr(box?.querySelector(`meta[itemprop="${name}"]`), 'content')
  }

  if (!readMeta('contentUrl')?.endsWith(`/${mediaId}`)) {
    return {}
  }

  return {
    title: readMeta('name'),
    description: readMeta('description'),
    date: readMeta('uploadDate'),
  }
}

// JW's cloud player library, `jwpsrv.com/library` before `jwplatform.com/libraries`, loaded beside
// a mount that an inline setup call fills. The mount sits before the library or between it and the
// setup call. It keeps whatever text it holds.
export const jwplayerLibraryEmbedResolver = createMarkupEmbedResolver(
  'script[src*="jwplatform.com/libraries/"], script[src*="jwpsrv.com/library/"]',
  (element) => {
    if (!parseUrlOnHosts(attr(element, 'src') ?? '', libraryHosts)) {
      return
    }

    const following = findSnippetSibling(element, 'nextElementSibling')
    const afterMount = findSnippetSibling(following, 'nextElementSibling')
    const setup = findScript(following) ?? findScript(afterMount)
    const config = setup?.textContent ?? ''
    const mountId = config.match(setupMountRegex)?.[1]
    const mediaId = config.match(setupPlaylistRegex)?.[1]

    if (!setup || !mountId || !mediaId) {
      return
    }

    const mounts = [findSnippetSibling(element, 'previousElementSibling'), following]

    if (!mounts.some((mount) => mount?.id === mountId)) {
      return
    }

    setup.remove()

    return { ...composeJwplayerEmbed(mediaId), ...readJwpppBox(element, mediaId) }
  },
)

// JW's WordPress plugins name the mount `jwplayer_{mediaId}_{playerId}_div`, with a counter before
// `_div` on Future plc's lazy mount.
const mountIdRegex = /^jwplayer_([^_]+)_[^_]+(?:_\d+)?_div$/

// A JW mount with no script left beside it: Future plc's lazy `data-key` mount, or a mount copied
// after the player ran. A mount that holds text keeps it.
export const jwplayerMountEmbedResolver = createMarkupEmbedResolver(
  'div.jwplayer[id^="jwplayer_"]',
  (element) => {
    if (element.textContent?.trim()) {
      return
    }

    const mediaId = element.id.match(mountIdRegex)?.[1]

    if (!mediaId) {
      return
    }

    return composeJwplayerEmbed(mediaId)
  },
)
