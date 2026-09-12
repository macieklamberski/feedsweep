import { getPathSegments } from 'trousse'
import type { EmbedResolverResult } from '../types.js'
import { attr, find } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'tumblr'

const tumblrEmbedHosts = ['embed.tumblr.com']
// A post page is `{blog}.tumblr.com/post/{id}/{slug}` on the old form and
// `tumblr.com/{blog}/{id}/{slug}` on the current one.
const tumblrHosts = ['tumblr.com']

// The blog key is a base64url token, written bare on the older route and prefixed `t:` on the
// current one. Both spellings address the same post.
const safeBlogKeyRegex = /^(?:t:)?[\w-]+$/
const safePostIdRegex = /^\d+$/

const readPostEmbed = (href: string | undefined): EmbedResolverResult | undefined => {
  const parsed = parseUrlOnHosts(href, tumblrEmbedHosts)
  const segments = parsed ? getPathSegments(parsed) : []
  const [route, kind, blogKey, postId] = segments

  if (!parsed || route !== 'embed' || kind !== 'post' || !blogKey || !postId) {
    return
  }

  if (!safeBlogKeyRegex.test(blogKey) || !safePostIdRegex.test(postId)) {
    return
  }

  return {
    provider,
    id: `${blogKey}/${postId}`,
    src: parsed.href,
  }
}

// Tumblr's own post embed: an inert div holding the complete frame url, beside a loader script
// the pipeline drops, so the post renders as nothing but the anchor under it.
// The same post carried as a real iframe, which a handful of feeds write instead of the div.
export const tumblrIframeEmbedResolver = createUrlEmbedResolver(tumblrEmbedHosts, readPostEmbed)

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
