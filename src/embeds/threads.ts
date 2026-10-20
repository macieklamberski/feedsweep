import type { EmbedRenderHint } from '../types.js'
import { attr } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { atUsername, createMarkupEmbedResolver, findBareHandle } from '../utils/widgets.js'

const provider = 'threads'

// `threads.net` is the host older snippets carry, and it serves the same frame.
const threadsHosts = ['threads.com', 'threads.net']

// `/@{handle}/post/{code}` is the permalink the embed dialog writes, `/t/{code}` the short form.
// The route words are case-sensitive on threads.com.
const postPathRegex = /^\/(?:@([^/]+)\/post|t)\/([^/]+)/

type Post = { path: string; code: string; handle?: string }

const readPostUrl = (value: string | undefined): Post | undefined => {
  const parsed = parseUrlOnHosts(value, threadsHosts)
  const match = parsed?.pathname.match(postPathRegex)

  if (!match) {
    return
  }

  return { path: match[0], code: match[2], handle: match[1] }
}

// Where the post is named: the attribute the dialog writes, then any anchor in the quote, which
// a sanitized copy leaves as the only trace.
const findPost = (element: Element): Post | undefined => {
  const declared = readPostUrl(attr(element, 'data-text-post-permalink'))

  if (declared) {
    return declared
  }

  for (const anchor of element.querySelectorAll('a[href]')) {
    const post = readPostUrl(attr(anchor, 'href'))

    if (post) {
      return post
    }
  }
}

// Threads's embed dialog ships a post as a blockquote holding only a "View on Threads" link,
// which `embed.js` replaces with the frame `{permalink}/embed/`.
export const threadsBlockquoteEmbedResolver = createMarkupEmbedResolver(
  'blockquote.text-post-media',
  (element) => {
    const post = findPost(element)

    if (!post) {
      return
    }

    // A `/t/` permalink names no account, so the handle comes from the dialog's "Post by @handle"
    // line.
    const handle = post.handle ?? findBareHandle(element)

    return {
      provider,
      // The frame plays the post for any handle in its path, so the shortcode alone names it.
      id: post.code,
      src: `https://www.threads.com${post.path}/embed/`,
      url: `https://www.threads.com${post.path}`,
      author: handle ? atUsername(handle) : undefined,
    }
  },
)

export const threadsRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://www.threads.com',
  // The frame posts its content height to the parent as a bare number.
  readHeight: readPixels,
}
