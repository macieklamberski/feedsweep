import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const amebaHosts = ['static.blog-video.jp']
const amebloHosts = ['ameblo.jp']

const reblogCardPathRegex = /^\/s\/embed\/reblog-card\/([^/]+)\/entry-([^/]+)\.html$/
const imagePagePathRegex = /^\/p\/embed\/([^/]+\/image-[^/]+)\.html$/

// Ameba's movie player, `static.blog-video.jp/?v={id}`, for a video uploaded into a blog post.
// The id is the whole key the platform's own endpoint takes. Its thumbnails are pathed by the
// blog's own user id, which the carrier does not name, so no poster is minted.
export const amebaResolveEmbed: ResolveEmbed = (url) => {
  const videoId = parseUrl(url, placeholderBaseUrl)?.searchParams.get('v')

  if (!videoId) {
    return
  }

  return {
    provider: 'ameba',
    id: videoId,
    src: `https://${amebaHosts[0]}/${composeQuery({ v: videoId })}`,
  }
}

export const amebaMoviePlayerEmbedResolver = createUrlEmbedResolver(amebaHosts, amebaResolveEmbed)

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
  const match = reblogCardPathRegex.exec(parseUrl(url, placeholderBaseUrl)?.pathname ?? '')

  if (!match) {
    return
  }

  const id =
    readReblogCardId(attr(element, 'data-ameba-id'), attr(element, 'data-entry-id')) ??
    readReblogCardId(match[1], match[2])

  if (!id) {
    return
  }

  return {
    provider: 'ameba',
    id,
    src: `https://${amebloHosts[0]}/s/embed/reblog-card/${id}.html`,
    url: `https://${amebloHosts[0]}/${id}.html`,
  }
})

// Ameba's in-article image page, `ameblo.jp/p/embed/{amebaId}/image-{entryId}-{imageId}.html`,
// the iframe for one image inside a post. The image file's url carries an upload date, an hour and
// three hashed path segments the carrier does not name, so no thumbnail is minted.
export const amebaImagePageEmbedResolver = createUrlEmbedResolver(amebloHosts, (url) => {
  const match = imagePagePathRegex.exec(parseUrl(url, placeholderBaseUrl)?.pathname ?? '')

  if (!match) {
    return
  }

  return {
    provider: 'ameba',
    id: match[1],
    src: `https://${amebloHosts[0]}/p/embed/${match[1]}.html`,
    url: `https://${amebloHosts[0]}/${match[1]}.html`,
  }
})
