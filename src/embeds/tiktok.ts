import { encodePathSegment } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr, find, text, textNode } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import {
  atUsername,
  createMarkupEmbedResolver,
  createS9eEmbedResolver,
  createUrlEmbedResolver,
} from '../utils/widgets.js'

const provider = 'tiktok'

const hosts = ['tiktok.com']

// Every player url TikTok has issued frames the clip by its numeric id: `/embed/{id}` and
// `/embed/v2/{id}` from the oEmbed loader's eras, `/player/v1/{id}` from the current player.
// All three still serve (probed 2026-08-15; both embed paths answer 400 on a fabricated id).
const playerPathRegex = /^\/(?:embed(?:\/v2)?|player\/v1)\/(\d+)\/?$/i

// A watch url names the clip's owner and the clip: `/@handle/video/{id}`. Sanitized copies
// sometimes keep only the `/video/{id}` half, so the handle is optional.
const watchPathRegex = /^(?:\/@([^/]+))?\/video\/(\d+)\/?$/i

const sizes = {
  // Not a 9/16 ratio: the frame stays 738 tall at any width, and the ratio asks 1778 at 1000.
  // The clip is letterboxed inside a frame whose header, caption, sound row and action rail set
  // the height. TikTok's own oEmbed answers 739 for the same clip.
  video: { height: 738 },
  profile: { height: 478 },
}

type Clip = { handle?: string; videoId?: string }

const readWatchUrl = (parsed: URL | undefined): Clip => {
  if (!parsed) {
    return {}
  }

  const [, handle, videoId] = parsed.pathname.match(watchPathRegex) ?? []

  return { handle, videoId }
}

// A profile url and nothing else: `/@handle`, with no video segment after it.
const profilePathRegex = /^\/@([^/]+)\/?$/
// The account's opaque id, which TikTok writes where a handle goes.
const secUidPrefix = 'MS4wLjABAAAA'

const readProfileHandle = (anchor: Element | undefined): string | undefined => {
  return parseUrlOnHosts(attr(anchor, 'href'), hosts)?.pathname.match(profilePathRegex)?.[1]
}

const resolveClip = (element: Element): EmbedResolverResult | undefined => {
  const declared = attr(element, 'data-video-id')
  const cite = attr(element, 'cite')
  const cited = readWatchUrl(parseUrlOnHosts(cite, hosts))

  let linked: Clip = {}

  for (const anchor of element.querySelectorAll('a[href]')) {
    const href = attr(anchor, 'href')
    const clip = readWatchUrl(parseUrlOnHosts(href, hosts))

    if (clip.videoId) {
      linked = clip
      break
    }
  }

  // Sanitizers empty or strip `data-video-id` while leaving the cite or a caption link intact.
  const videoId = declared ?? cited.videoId ?? linked.videoId

  if (!videoId) {
    return
  }

  // The declared id comes out of its attribute decoded, and it goes into a path.
  const segment = encodePathSegment(videoId)

  const profile = find(element, 'section a[href]', (anchor) => !!readProfileHandle(anchor))
  const byline = text(profile)
  const profileHandle = readProfileHandle(profile)
  // Where the link holds a secUid, the account name survives only in the link's `title`, as
  // `@{name}`, which is not always the handle.
  const author = profileHandle?.startsWith(secUidPrefix) ? attr(profile, 'title') : profileHandle
  const caption = find(element, 'section p', (paragraph) => {
    const value = text(paragraph)

    return Boolean(value && value !== byline && !value.startsWith('♬'))
  })

  // A handle read from a path is already a segment.
  const handle = cited.handle ?? linked.handle ?? profileHandle

  // The watch page is the path the id already spells, so it is mintable from the same two halves
  // wherever a handle survives: a blockquote whose only source is a body anchor names both. The
  // cite comes first where it still names the clip, since that is the url the publisher wrote.
  const watchPath = handle ? `@${handle}/video/${segment}` : undefined

  return {
    provider,
    // TikTok's oEmbed endpoint takes the watch url, which needs the handle beside the video id.
    id: watchPath ?? videoId,
    src: `https://www.tiktok.com/embed/v2/${segment}`,
    // A sanitized cite is truncated to the bare host, which links nothing worth keeping.
    url: cited.videoId ? cite : watchPath && `https://www.tiktok.com/${watchPath}`,
    description: text(caption),
    author: author ? atUsername(author) : undefined,
    ...sizes.video,
  }
}

// The account a blockquote names, from `data-unique-id` where the creator widget declares it,
// otherwise from the profile anchor, the only source the half-encoded shape keeps. The attribute
// comes out decoded, and the anchor's path is already a segment.
const readHandle = (element: Element): { handle: string; segment: string } | undefined => {
  const declared = attr(element, 'data-unique-id')

  if (declared) {
    return { handle: declared, segment: encodePathSegment(declared) }
  }

  for (const anchor of element.querySelectorAll('a[href]')) {
    const handle = readProfileHandle(anchor)

    if (handle) {
      return { handle, segment: handle }
    }
  }
}

const resolveAccount = (element: Element): EmbedResolverResult | undefined => {
  const account = readHandle(element)

  if (!account) {
    return
  }

  const { handle, segment } = account

  const cite = attr(element, 'cite')
  const isCitedProfile = Boolean(cite && parseUrlOnHosts(cite, hosts))

  return {
    provider,
    id: atUsername(handle),
    src: `https://www.tiktok.com/embed/@${segment}`,
    url: isCitedProfile ? cite : `https://www.tiktok.com/@${segment}`,
    ...sizes.profile,
    description: textNode(element),
    author: atUsername(handle),
  }
}

// TikTok's oEmbed blockquote: caption and hashtag anchors that only embed.js turns into a player.
export const tiktokBlockquoteEmbedResolver = createMarkupEmbedResolver(
  'blockquote.tiktok-embed',
  (element) => resolveClip(element) ?? resolveAccount(element),
)

// A post has no name: its words go to `description`, and the frame's title is not read.
export const tiktokResolveEmbed: ResolveUrlEmbed = (url) => {
  const playerId = url.pathname.match(playerPathRegex)?.[1]

  if (playerId) {
    return {
      provider,
      id: playerId,
      src: `https://www.tiktok.com/embed/v2/${playerId}`,
      ...sizes.video,
    }
  }

  const { handle, videoId } = readWatchUrl(url)

  if (!videoId) {
    return
  }

  return {
    provider,
    id: handle ? `@${handle}/video/${videoId}` : videoId,
    src: `https://www.tiktok.com/embed/v2/${videoId}`,
    url: url.href,
    ...sizes.video,
  }
}

// A pasted TikTok player iframe, or a frame of the watch page, which refuses framing.
export const tiktokIframeEmbedResolver = createUrlEmbedResolver(hosts, tiktokResolveEmbed)

// A forum's s9e MediaEmbed helper frame, naming the clip id in its url fragment.
export const tiktokS9eEmbedResolver = createS9eEmbedResolver('tiktok', (videoId) => {
  const playerUrl = new URL(`https://www.tiktok.com/embed/v2/${encodePathSegment(videoId)}`)

  return tiktokResolveEmbed(playerUrl)
})

// MetaSlider Pro's TikTok slide: a poster image that only the plugin's script swaps for the player.
export const tiktokMetasliderEmbedResolver = createMarkupEmbedResolver(
  'li.ms-tiktok div.tiktok[data-video-id]',
  (element) => {
    const videoId = attr(element, 'data-video-id')

    if (!videoId) {
      return
    }

    // The id comes out of its attribute decoded, and it goes into a path.
    const segment = encodePathSegment(videoId)

    const cite = attr(element, 'data-cite')
    const { handle } = readWatchUrl(parseUrlOnHosts(cite, hosts))
    const watchPath = handle ? `@${handle}/video/${segment}` : undefined

    return {
      provider,
      id: watchPath ?? videoId,
      src: `https://www.tiktok.com/embed/v2/${segment}`,
      url: watchPath ? `https://www.tiktok.com/${watchPath}` : undefined,
      thumbnail: attr(find(element, 'img.msDefaultImage'), 'src'),
      ...sizes.video,
    }
  },
)
