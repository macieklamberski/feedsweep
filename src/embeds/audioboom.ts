import { getPathSegments, isAnyOf } from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  FieldCleaner,
  ResolveUrlEmbed,
} from '../types.js'
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
// S3 serves a bucket path-style too, on its own host with the bucket as the first segment.
const bucketHost = 's3.amazonaws.com'

// The `mp3` flashvar names the audio file, the post page with `.mp3` on its last segment.
const mp3ExtensionRegex = /\.mp3(?=\?|$)/i

// `/posts/{id}/embed[/v4]` is current. `/boos/{id}/embed` is the pre-rename spelling.
const postIdMarkers = ['posts', 'boos']

const sizes = {
  // `/embed/v4`, the current player, fills whatever frame it gets, so this is the smallest box it
  // accepts.
  player: { height: 300 },
}

export const extractAudioboomPost = (link: URL): string | undefined => {
  const segments = getPathSegments(link)
  const marker = segments.findIndex((segment) => isAnyOf(segment, postIdMarkers))

  return marker >= 0 ? segments[marker + 1]?.match(postIdRegex)?.[1] : undefined
}

// Every carrier, the older compact player and the Flash player included, is minted onto v4.
const composeEmbed = (postId: string): EmbedResolverResult => {
  return {
    provider,
    id: postId,
    src: `https://embeds.audioboom.com/posts/${postId}/embed/v4`,
    ...sizes.player,
  }
}

// No metadata offline: Audioboom's oEmbed accepts only `audioboom.com` page urls, not the
// `embeds.` player url the markup carries, so a title needs a lookup the enricher would do.
export const audioboomResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const postId = extractAudioboomPost(url)

  if (!postId) {
    return
  }

  return {
    ...composeEmbed(postId),
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

    return parsed && audioboomResolveEmbed(parsed)
  },
)

// Audioboo's Flash player, which no browser runs. It names the post only in its flashvars, as the
// page in `mp3LinkURL` or the audio file in `mp3`.
const audioboomFlashResolveEmbed: ResolveUrlEmbed = (url, element) => {
  // Another bucket, path-style or on its own subdomain of S3's host, is not Audioboo's.
  const bucket = url.hostname === bucketHost ? getPathSegments(url)[0] : url.hostname

  if (!bucket || !flashHosts.includes(bucket)) {
    return
  }

  const link = flashVar(element, 'mp3LinkURL') ?? flashVar(element, 'mp3')
  const parsed = parseUrlOnHosts(link?.replace(mp3ExtensionRegex, ''), audioboomHosts)

  if (!parsed) {
    return
  }

  const postId = extractAudioboomPost(parsed)

  if (!postId) {
    return
  }

  return {
    ...composeEmbed(postId),
    title: flashVar(element, 'mp3Title'),
    author: flashVar(element, 'mp3Author'),
  }
}

export const audioboomFlashEmbedResolver = createUrlEmbedResolver(
  [...flashHosts, bucketHost],
  audioboomFlashResolveEmbed,
)

export const audioboomFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Audioboom player' },
  // The label of Audioboom's player under its pre-rename name.
  { provider, field: 'title', drop: 'Audioboo player' },
]

// Starts playback on the click that loads the player: the v4 player reads `autoplay` off its
// query and starts from 0 once the audio node is ready. Undocumented, read from its chunks.
export const audioboomRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
