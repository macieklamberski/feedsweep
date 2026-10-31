import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  FieldCleaner,
  ResolveUrlEmbed,
} from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import {
  createMarkupEmbedResolver,
  createUrlEmbedResolver,
  readCleanedAttributeUrl,
} from '../utils/widgets.js'

const provider = 'audioboom'

// `[^.]` keeps the enclosure out: `posts/{id}-{slug}.mp3` sits on the same host, and a slug that
// admitted the dot would turn every playable file into a placeholder.
// Audioboom's share code writes the slug hanging off the id, and the id alone addresses the post.
const postIdRegex = /^(\d+)(?:-[^.]*)?$/

// `audioboo.fm` is the pre-rename host.
const hosts = ['audioboom.com', 'audioboo.fm']

// Audioboo's Flash players, on its own host and on its S3 bucket.
const flashHosts = ['boos.audioboo.fm', 'abfiles.s3.amazonaws.com']
// S3 serves a bucket path-style too, on its own host with the bucket as the first segment.
const bucketHosts = ['s3.amazonaws.com']

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

  if (marker < 0) {
    return
  }

  const [, postSlug] = segments.slice(marker)

  return postSlug?.match(postIdRegex)?.[1]
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
export const audioboomIframeEmbedResolver = createUrlEmbedResolver(hosts, audioboomResolveEmbed)

// Audioboo's WordPress plugin: a div holding the player url, hydrated by a script the feed lacks.
// `data-boourl` holds the same player url the iframe form holds.
export const audioboomWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.ab-player[data-boourl]',
  (element, context) => {
    const parsed = parseUrlOnHosts(readCleanedAttributeUrl(element, 'data-boourl', context), hosts)

    return parsed && audioboomResolveEmbed(parsed)
  },
)

// Audioboo's Flash player, which no browser runs. It names the post only in its flashvars, as the
// page in `mp3LinkURL` or the audio file in `mp3`.
const audioboomFlashResolveEmbed: ResolveUrlEmbed = (url, element) => {
  // Another bucket, path-style or on its own subdomain of S3's host, is not Audioboo's.
  const isPathStyle = isHostOf(url, bucketHosts)
  const [bucket] = getPathSegments(url)

  if (isPathStyle && !flashHosts.includes(bucket)) {
    return
  }

  if (!isPathStyle && !isHostOf(url, flashHosts)) {
    return
  }

  const link = flashVar(element, 'mp3LinkURL') ?? flashVar(element, 'mp3')
  const parsed = parseUrlOnHosts(link?.replace(mp3ExtensionRegex, ''), hosts)

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
  [...flashHosts, ...bucketHosts],
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
