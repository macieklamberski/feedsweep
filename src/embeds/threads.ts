import { encodePathSegment } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import {
  atUsername,
  createMarkupEmbedResolver,
  createS9eEmbedResolver,
  createUrlEmbedResolver,
  findBareHandle,
} from '../utils/widgets.js'

const provider = 'threads'

// `threads.net` is the host older snippets carry, and it serves the same frame.
const hosts = ['threads.com', 'threads.net']

// `/@{handle}/post/{code}` is the permalink the embed dialog writes, `/t/{code}` the short form.
// The route words are case-sensitive on threads.com.
const postPathRegex = /^\/(?:@([^/]+)\/post|t)\/([^/]+)/i
const framePathRegex = /^\/(?:@[^/]+\/post|t)\/[^/]+\/embed\/?$/i

type Post = { path: string; code: string; handle?: string }

const readPost = (url: URL | undefined): Post | undefined => {
  const match = url?.pathname.match(postPathRegex)

  if (!match) {
    return
  }

  const [, handle, code] = match
  const path = handle ? `/@${handle}/post/${code}` : `/t/${code}`

  return { path, code, handle }
}

// Where the post is named: the attribute the dialog writes, then any anchor in the quote, which
// a sanitized copy leaves as the only trace.
const findPost = (element: Element): Post | undefined => {
  const permalink = parseUrlOnHosts(attr(element, 'data-text-post-permalink'), hosts)
  const declared = readPost(permalink)

  if (declared) {
    return declared
  }

  for (const anchor of element.querySelectorAll('a[href]')) {
    const href = parseUrlOnHosts(attr(anchor, 'href'), hosts)
    const post = readPost(href)

    if (post) {
      return post
    }
  }
}

const composePost = (post: Post, handle?: string): EmbedResolverResult => {
  return {
    provider,
    // The frame plays the post for any handle in its path, so the shortcode alone names it.
    id: post.code,
    src: `https://www.threads.com${post.path}/embed/`,
    url: `https://www.threads.com${post.path}`,
    author: handle ? atUsername(handle) : undefined,
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
    return composePost(post, post.handle ?? findBareHandle(element))
  },
)

// The frame `embed.js` writes, `{permalink}/embed/`, saved into the feed by a CMS that ran it.
export const threadsResolveEmbed: ResolveUrlEmbed = (url) => {
  if (!framePathRegex.test(url.pathname)) {
    return
  }

  const post = readPost(url)

  if (!post) {
    return
  }

  return composePost(post, post.handle)
}

export const threadsIframeEmbedResolver = createUrlEmbedResolver(hosts, threadsResolveEmbed)

// A forum's s9e MediaEmbed helper frame, naming the post's shortcode in its url fragment.
export const threadsS9eEmbedResolver = createS9eEmbedResolver('threads', (code) => {
  const frame = new URL(`https://www.threads.com/t/${encodePathSegment(code)}/embed/`)

  return threadsResolveEmbed(frame)
})

export const threadsRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://www.threads.com',
  // The frame posts its content height to the parent as a bare number.
  readHeight: readPixels,
}
