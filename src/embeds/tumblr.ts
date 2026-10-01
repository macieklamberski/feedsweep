import { getPathSegments, isPlainObject } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult } from '../types.js'
import { attr, find } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { digitsRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'tumblr'

const tumblrEmbedHosts = ['embed.tumblr.com']
// A post page is `{blog}.tumblr.com/post/{id}/{slug}` on the old form and
// `tumblr.com/{blog}/{id}/{slug}` on the current one.
const tumblrHosts = ['tumblr.com']

// The blog key is written bare on the older route and prefixed `t:` on the current one. Both
// spellings address the same post, so the id keeps the bare one and `src` the current one.
const blogKeyPrefixRegex = /^t:/

const readPostEmbed = (href: string | undefined): EmbedResolverResult | undefined => {
  const parsed = parseUrlOnHosts(href, tumblrEmbedHosts)

  if (!parsed) {
    return
  }

  const [route, kind, blogKey, postId = ''] = getPathSegments(parsed)

  // The digits tell a post id from a route word such as `v2` standing in its place.
  if (route !== 'embed' || kind !== 'post' || !blogKey || !digitsRegex.test(postId)) {
    return
  }

  const bareKey = blogKey.replace(blogKeyPrefixRegex, '')

  return {
    provider,
    id: `${bareKey}/${postId}`,
    src: `https://embed.tumblr.com/embed/post/t:${bareKey}/${postId}/v2`,
  }
}

// Tumblr's post frame written as a real iframe, which a handful of feeds carry in place of the div.
export const tumblrIframeEmbedResolver = createUrlEmbedResolver(tumblrEmbedHosts, readPostEmbed)

// Tumblr's own post embed: an inert div holding the complete frame url, beside a loader script
// the pipeline drops, so the post renders as nothing but the anchor under it.
export const tumblrPostEmbedResolver = createMarkupEmbedResolver(
  'div.tumblr-post[data-href]',
  (element) => {
    const result = readPostEmbed(attr(element, 'data-href'))

    if (!result) {
      return
    }

    // The anchor under the div is the post page. Its text is that url again, never a title.
    const postUrl = parseUrlOnHosts(attr(find(element, 'a'), 'href'), tumblrHosts)

    return { ...result, url: postUrl?.href }
  },
)

// The frame posts its height unasked, as a JSON string whose `args` holds the body's scroll
// height, on load and again whenever its body resizes.
export const readTumblrHeight = (data: unknown): number | undefined => {
  if (typeof data !== 'string') {
    return
  }

  try {
    const message: unknown = JSON.parse(data)

    if (
      isPlainObject(message) &&
      message.method === 'tumblr-post:sizeChange' &&
      Array.isArray(message.args)
    ) {
      return readPixels(message.args[0])
    }
  } catch {}
}

export const tumblrRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://embed.tumblr.com',
  readHeight: readTumblrHeight,
}
