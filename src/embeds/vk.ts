import { isPlainObject, isPresent, parseUrl, toMap, trimObject } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { readPixels } from '../utils/hints.js'
import {
  composeQuery,
  encodePathSegment,
  pickQueryParams,
  placeholderBaseUrl,
  readQueryParam,
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
// since a public video's page ignores it. `t` is the start position, in seconds or as `1m30s`.
// Quality and autoplay are the reader's call.
const playerParams = ['oid', 'id', 'hash', 't']

// The calls `openapi.js` runs to fill a widget div, each naming the div's id first. A post or
// playlist names the owner, the item and the hash, a podcast the episode, and a poll an options
// object and the poll.
const widgetCallRegex =
  /VK\.Widgets\.(?<kind>Post|Playlist)\(\s*(?<elementQuote>["'])(?<element>.+?)\k<elementQuote>\s*,\s*(?<owner>[^,\s]+)\s*,\s*(?<item>[^,\s]+)\s*,\s*(?<hashQuote>["'])(?<hash>.*?)\k<hashQuote>/g
const podcastCallRegex =
  /VK\.Widgets\.(?<kind>Podcast)\(\s*(?<elementQuote>["'])(?<element>.+?)\k<elementQuote>\s*,\s*(?<itemQuote>["'])(?<item>.+?)\k<itemQuote>/g
const pollCallRegex =
  /VK\.Widgets\.(?<kind>Poll)\(\s*(?<elementQuote>["'])(?<element>.+?)\k<elementQuote>\s*,\s*\{[^}]*\}\s*,\s*(?<itemQuote>["'])(?<item>.+?)\k<itemQuote>/g
// The page's `VK.init` call, whose `apiId` `openapi.js` adds to every widget frame as `app`.
const initCallRegex = /VK\.init\(\s*\{[^}]*?\bapiId\s*:\s*(?<app>\d+)/

// A video's own page, `/video{owner}_{video}`, which plays on the player with the same ids. The
// signed owner tells it from `/videos{owner}`, `/video_ext.php` and `/video_embed`.
const videoPageRegex = /^\/video(?<owner>-?\d+)_(?<video>[^/]+)$/

// The widget frame opens its message channel only when its `window.name` is `fXD` and a
// five-character key, and it starts every message with that key.
const widgetFrameKey = 'feeds'

// VK's player, `video_ext.php?oid={ownerId}&id={videoId}`, the clip player beside it, and a
// video's page.
export const vkResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const page = parsed.pathname.match(videoPageRegex)?.groups
  const player = players.get(page ? '/video_ext.php' : parsed.pathname)
  const ownerId = page?.owner ?? readQueryParam(parsed.search, 'oid') ?? ''
  const videoId = page?.video ?? readQueryParam(parsed.search, 'id') ?? ''

  if (!player || !ownerId || !videoId) {
    return
  }

  const params = page ? { oid: ownerId, id: videoId } : pickQueryParams(parsed.search, playerParams)
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
// The podcast page does the same for any episode. A poll has no page outside the widget.
const composeWidgetEmbed = (
  call: Record<string, string>,
  app: string | undefined,
): EmbedResolverResult => {
  const { kind, owner, item, hash } = call

  if (kind === 'Post') {
    const id = `wall${owner}_${item}`
    const query = composeQuery({ owner_id: owner, post_id: item, hash })

    return {
      provider,
      id,
      src: `https://vk.ru/widget_post.php${query}`,
      url: `https://vk.ru/${encodePathSegment(id)}`,
    }
  }

  // `openapi.js` reads a third argument as options, so the hash VK's snippet passes never reaches
  // the frame.
  if (kind === 'Podcast') {
    return {
      provider,
      id: `podcast${item}`,
      src: `https://vk.ru/widget_podcast.php${composeQuery({ episode: item })}`,
    }
  }

  // A poll made under an app answers "Access denied" without that app's id.
  if (kind === 'Poll') {
    const query = composeQuery(trimObject({ app, poll_id: item }))

    return {
      provider,
      id: `widget_poll${item}`,
      src: `https://vk.ru/al_widget_poll.php${query}`,
    }
  }

  const query = composeQuery({ oid: owner, pid: item, hash })

  return {
    provider,
    id: `audio_playlist${owner}_${item}`,
    src: `https://vk.ru/widget_playlist.php${query}`,
  }
}

// VK's Post, Playlist, Podcast and Poll widgets: an empty div that `openapi.js` fills from an
// inline `VK.Widgets` call naming the div's id.
export const vkWidgetEmbedResolver = createMarkupEmbedResolver(
  'div[id^="vk_post_"], div[id^="vk_playlist_"], div[id^="vk_podcast_"], div[id^="vk_poll"]',
  (element) => {
    // A mount that already holds the post's text keeps it.
    if (element.textContent?.trim()) {
      return
    }

    const scripts = [...(element.parentElement?.querySelectorAll('script') ?? [])]
    const app = scripts
      .map((script) => {
        return script.textContent?.match(initCallRegex)?.groups?.app
      })
      .find(isPresent)

    for (const script of scripts) {
      const code = script.textContent ?? ''
      const calls = [widgetCallRegex, podcastCallRegex, pollCallRegex].flatMap((regex) => {
        return [...code.matchAll(regex)]
      })
      const call = calls.find((match) => match.groups?.element === element.id)

      if (!call?.groups) {
        continue
      }

      // One script can fill several divs, so it goes only when this div is all it fills.
      if (calls.length === 1) {
        script.remove()
      }

      return composeWidgetEmbed(call.groups, app)
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
