import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const amebaHosts = ['static.blog-video.jp']
const amebloHosts = ['ameblo.jp']

// An id is letters and digits, with no length band: the ids in the corpus run to 26 characters
// and a bound read off them would refuse the next generation.
const safeVideoIdRegex = /^[A-Za-z0-9]+$/
const reblogCardPathRegex = /^\/s\/embed\/reblog-card\/([^/]+)\/entry-([^/]+)\.html$/
const safeBlogIdRegex = /^[A-Za-z0-9_-]+$/
const safeEntryIdRegex = /^\d+$/

// Ameba's movie player, `static.blog-video.jp/?v={id}`, for a video uploaded into a blog post.
// The id is the whole key the platform's own endpoint takes. Its thumbnails are pathed by the
// blog's own user id, which the carrier does not name, so no poster is minted.
export const amebaResolveEmbed: ResolveEmbed = (url) => {
  const videoId = parseUrl(url, placeholderBaseUrl)?.searchParams.get('v')

  if (!videoId || !safeVideoIdRegex.test(videoId)) {
    return
  }

  return {
    provider: 'ameba',
    id: videoId,
    src: `https://${amebaHosts[0]}/?v=${videoId}`,
  }
}

export const amebaEmbedResolver = createUrlEmbedResolver(amebaHosts, amebaResolveEmbed)

const readReblogCardId = (
  blogId: string | undefined,
  entryId: string | undefined,
): string | undefined => {
  const safeBlogId = keepIfMatches(blogId, safeBlogIdRegex)
  const safeEntryId = keepIfMatches(entryId, safeEntryIdRegex)

  if (safeBlogId && safeEntryId) {
    return `${safeBlogId}/entry-${safeEntryId}`
  }
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
    src: url,
    url: `https://${amebloHosts[0]}/${id}.html`,
  }
})
