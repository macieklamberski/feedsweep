import { composeQuery, encodePathSegment, getQueryParam } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ameba'

const sizes = {
  video: { ratio: '16/9' },
  reblogCard: { height: 234 },
  image: { ratio: '360/416' },
}

const hosts = ['static.blog-video.jp']
const amebloHosts = ['ameblo.jp']

const reblogCardPathRegex =
  /^\/s\/embed\/reblog-card\/(?<blogId>[^/]+)\/entry-(?<entryId>[^/]+)\.html$/i
const imagePagePathRegex = /^\/p\/embed\/([^/]+\/image-[^/]+)\.html$/i

// Ameba's movie player, `static.blog-video.jp/?v={id}`, for a video uploaded into a blog post.
// The id is the whole key the platform's own endpoint takes. Its thumbnails are pathed by the
// blog's own user id, which the carrier does not name, so no poster is minted.
export const amebaResolveEmbed: ResolveUrlEmbed = (url) => {
  const videoId = getQueryParam(url.searchParams, 'v')

  if (!videoId) {
    return
  }

  return {
    provider,
    id: videoId,
    src: `https://static.blog-video.jp/${composeQuery({ v: videoId })}`,
    ...sizes.video,
  }
}

export const amebaMoviePlayerEmbedResolver = createUrlEmbedResolver(hosts, amebaResolveEmbed)

const readReblogCardId = (
  blogId: string | undefined,
  entryId: string | undefined,
): string | undefined => {
  if (!blogId || !entryId) {
    return
  }

  return `${blogId}/entry-${entryId}`
}

// Ameba's reblog card, `ameblo.jp/s/embed/reblog-card/{amebaId}/entry-{entryId}.html`, the iframe
// a blogger gets when reblogging another Ameba post. Only the blog and the entry together name
// the reblogged post, so the id carries the pair and composes the post's own page from it.
export const amebaReblogCardEmbedResolver = createUrlEmbedResolver(amebloHosts, (url, element) => {
  const card = reblogCardPathRegex.exec(url.pathname)?.groups

  if (!card) {
    return
  }

  const blogId = attr(element, 'data-ameba-id')
  const entryId = attr(element, 'data-entry-id')
  // A stated pair comes out of its attributes decoded, and both halves go into a path.
  const id =
    readReblogCardId(encodePathSegment(blogId ?? ''), encodePathSegment(entryId ?? '')) ??
    readReblogCardId(card.blogId, card.entryId)

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://ameblo.jp/s/embed/reblog-card/${id}.html`,
    url: `https://ameblo.jp/${id}.html`,
    ...sizes.reblogCard,
  }
})

// Ameba's in-article image page, `ameblo.jp/p/embed/{amebaId}/image-{entryId}-{imageId}.html`,
// the iframe for one image inside a post. The image file's url carries an upload date, an hour and
// three hashed path segments the carrier does not name, so no thumbnail is minted.
export const amebaImagePageEmbedResolver = createUrlEmbedResolver(amebloHosts, (url) => {
  const match = imagePagePathRegex.exec(url.pathname)

  if (!match) {
    return
  }

  return {
    provider,
    id: match[1],
    src: `https://ameblo.jp/p/embed/${match[1]}.html`,
    url: `https://ameblo.jp/${match[1]}.html`,
    ...sizes.image,
  }
})
