import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'audioboom'

// `[^.]` keeps the enclosure out: `posts/{id}-{slug}.mp3` sits on the same host, and a slug that
// admitted the dot would turn every playable file into a placeholder.
// Audioboom's share code writes the slug hanging off the id, and the id alone addresses the post.
const postIdRegex = /^(\d+)(?:-[^.]*)?$/

// `audioboo.fm` is the pre-rename host.
const audioboomHosts = ['audioboom.com', 'audioboo.fm']

// Audioboo's Flash players, on its own host and on its S3 bucket.
const flashHosts = ['boos.audioboo.fm', 'abfiles.s3.amazonaws.com']

// The `mp3` flashvar names the audio file, the post page with `.mp3` on its last segment.
const mp3ExtensionRegex = /\.mp3(?=\?|$)/

// `/posts/{id}/embed[/v4]` is current. `/boos/{id}/embed` is the pre-rename spelling.
const postIdMarkers = ['posts', 'boos']

// `/embed/v4` is the full player at 300, and `/posts/{id}/embed` is the compact bar at 95. Both
// fill whatever frame they get, so these are the smallest box each accepts.
const playerHeights = { v4: 300, legacy: 95 }

export const extractAudioboomPost = (
  link: string,
): { id: string; isCurrent: boolean } | undefined => {
  const segments = getPathSegments(link)
  const marker = segments.findIndex((segment) => postIdMarkers.includes(segment))
  const id = marker >= 0 ? segments[marker + 1]?.match(postIdRegex)?.[1] : undefined

  if (!id) {
    return
  }

  return { id, isCurrent: segments.includes('v4') }
}

// No metadata offline: Audioboom's oEmbed accepts only `audioboom.com` page urls, not the
// `embeds.` player url the markup carries, so a title needs a lookup the enricher would do.
export const audioboomResolveEmbed: ResolveEmbed = (url, element) => {
  const post = extractAudioboomPost(url)

  if (!post) {
    return
  }

  return {
    provider,
    id: post.id,
    // Not upgraded to v4: that would put a 300px player inside the 95px the publisher chose.
    src: post.isCurrent
      ? `https://embeds.audioboom.com/posts/${post.id}/embed/v4`
      : `https://embeds.audioboom.com/posts/${post.id}/embed`,
    height: post.isCurrent ? playerHeights.v4 : playerHeights.legacy,
    title: attr(element, 'title'),
  }
}

// Audioboom's player iframe, the full v4 player or the older compact bar.
export const audioboomIframeEmbedResolver = createUrlEmbedResolver(
  audioboomHosts,
  audioboomResolveEmbed,
)

// Audioboo's WordPress plugin: a div holding the player url, hydrated by a script the feed lacks.
// `data-boourl` holds the same player url the iframe form holds.
export const audioboomWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.ab-player[data-boourl]',
  (element) => {
    const parsed = parseUrlOnHosts(attr(element, 'data-boourl'), audioboomHosts)

    return parsed && audioboomResolveEmbed(parsed.href)
  },
)

// Audioboo's Flash player, which no browser runs. It names the post only in its flashvars, as the
// page in `mp3LinkURL` or the audio file in `mp3`. Audioboo's embed code paired it with the
// compact player, which answers for the same id.
const audioboomFlashResolveEmbed: ResolveEmbed = (_url, element) => {
  const link = flashVar(element, 'mp3LinkURL') ?? flashVar(element, 'mp3')
  const parsed = parseUrlOnHosts(link?.replace(mp3ExtensionRegex, ''), audioboomHosts)

  if (!parsed) {
    return
  }

  const post = extractAudioboomPost(parsed.href)

  if (!post) {
    return
  }

  return {
    provider,
    id: post.id,
    src: `https://embeds.audioboom.com/posts/${post.id}/embed`,
    height: playerHeights.legacy,
    title: flashVar(element, 'mp3Title'),
    author: flashVar(element, 'mp3Author'),
  }
}

export const audioboomFlashEmbedResolver = createUrlEmbedResolver(
  flashHosts,
  audioboomFlashResolveEmbed,
)

export const audioboomFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Audioboom player' },
]

// Starts playback on the click that loads the player: the v4 player reads `autoplay` off its
// query and starts from 0 once the audio node is ready. Undocumented, read from its chunks.
export const audioboomRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
