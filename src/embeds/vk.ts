import { isPlainObject, parseUrl, toMap } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import {
  composeQuery,
  encodePathSegment,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'vk'

const vkHosts = ['vk.com', 'vk.ru', 'vkontakte.ru', 'vkvideo.ru']

// The page a player opens is spelled with the endpoint's own word, on the host vk.com redirects
// videos to. A clip page on vk.com redirects to an unsupported-browser page instead.
// `video_embed` serves no player, so it mints onto `video_ext.php` with the same ids.
const players = toMap({
  '/clip_ext.php': { kind: 'clip', path: '/clip_ext.php' },
  '/video_embed': { kind: 'video', path: '/video_ext.php' },
  '/video_ext.php': { kind: 'video', path: '/video_ext.php' },
})

// `hash` unlocks a video its owner shared privately, so it stays in `src`. The page url drops it,
// since a public video's page ignores it. Quality and autoplay are the reader's call.
const playerParams = ['oid', 'id', 'hash']

// The call `openapi.js` runs to fill a widget div: the div's id, the owner, the post or playlist,
// and the hash.
const widgetCallRegex =
  /VK\.Widgets\.(Post|Playlist)\(\s*(["'])(.+?)\2\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*(["'])(.*?)\6/g

// The widget frame opens its message channel only when its `window.name` is `fXD` and a
// five-character key, and it starts every message with that key.
const widgetFrameKey = 'feeds'

// VK's player, `video_ext.php?oid={ownerId}&id={videoId}`, and the clip player beside it.
export const vkResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const player = players.get(parsed.pathname)
  const ownerId = parsed.searchParams.get('oid') ?? ''
  const videoId = parsed.searchParams.get('id') ?? ''

  if (!player || !ownerId || !videoId) {
    return
  }

  const params = pickQueryParams(parsed.search, playerParams)
  const id = `${ownerId}_${videoId}`
  // See: https://dev.vk.com/ru/widgets/video, which writes the player on vk.ru.
  const src = `https://vk.ru${player.path}${composeQuery(params)}`

  return {
    provider,
    id,
    src,
    // Both ids come out of the query decoded, and they go into a path.
    url: `https://vkvideo.ru/${player.kind}${encodePathSegment(id)}`,
    ratio: '16/9',
  }
}

export const vkEmbedResolver = createUrlEmbedResolver(vkHosts, vkResolveEmbed)

// `hash` unlocks the post, and the widget answers "Error" without it. The playlist widget
// ignores it, and its page answers the same shell for any playlist, so it gets no page url.
const composeWidgetEmbed = (
  kind: string,
  ownerId: string,
  itemId: string,
  hash: string,
): EmbedResolverResult => {
  if (kind === 'Post') {
    const id = `wall${ownerId}_${itemId}`
    const query = composeQuery({ owner_id: ownerId, post_id: itemId, hash })

    return {
      provider,
      id,
      src: `https://vk.ru/widget_post.php${query}`,
      url: `https://vk.ru/${encodePathSegment(id)}`,
    }
  }

  const query = composeQuery({ oid: ownerId, pid: itemId, hash })

  return {
    provider,
    id: `audio_playlist${ownerId}_${itemId}`,
    src: `https://vk.ru/widget_playlist.php${query}`,
  }
}

// VK's Post and Playlist widgets: an empty div that `openapi.js` fills from an inline
// `VK.Widgets.Post` or `VK.Widgets.Playlist` call naming the div's id.
export const vkWidgetEmbedResolver = createMarkupEmbedResolver(
  'div[id^="vk_post_"], div[id^="vk_playlist_"]',
  (element) => {
    for (const script of element.parentElement?.querySelectorAll('script') ?? []) {
      const calls = [...(script.textContent ?? '').matchAll(widgetCallRegex)]
      const call = calls.find((match) => match[3] === element.id)

      if (!call) {
        continue
      }

      // One script can fill several divs, so it goes only when this div is all it fills.
      if (calls.length === 1) {
        script.remove()
      }

      const [, kind, , , ownerId, itemId, , hash] = call

      return composeWidgetEmbed(kind, ownerId, itemId, hash)
    }
  },
)

// The player posts its state with `event: 'inited'` once it has loaded, and only when `js_api` is
// on its url.
export const isVkReady = (data: unknown): boolean => {
  return isPlainObject(data) && data.event === 'inited'
}

// See: https://vk.ru/js/api/openapi.js, whose fastXDM client posts `{key}:["resize",[height]]`.
export const readVkHeight = (data: unknown): number | undefined => {
  if (typeof data !== 'string' || !data.startsWith(`${widgetFrameKey}:`)) {
    return
  }

  try {
    const message: unknown = JSON.parse(data.slice(widgetFrameKey.length + 1))

    if (Array.isArray(message) && message[0] === 'resize' && Array.isArray(message[1])) {
      return readPixels(message[1][0])
    }
  } catch {}
}

// See: https://vk.com/js/api/videoplayer.js.
// `autoplay=1` starts the player muted, while a play command starts it with sound.
export const vkRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { js_api: '1' },
  frameName: `fXD${widgetFrameKey}`,
  isReady: isVkReady,
  requestPlay: { method: 'play' },
  readHeight: readVkHeight,
}
