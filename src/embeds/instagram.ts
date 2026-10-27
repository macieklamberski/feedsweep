import {
  decodeSegment,
  encodePathSegment,
  includesAnyOf,
  isAnyOf,
  isPlainObject,
  type Nullish,
  toMap,
} from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  FieldCleaner,
  ResolveUrlEmbed,
} from '../types.js'
import { attr, find, jsonAttr, text } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import {
  atUsername,
  bareHandleRegex,
  createMarkupEmbedResolver,
  createS9eEmbedResolver,
  createUrlEmbedResolver,
} from '../utils/widgets.js'

const provider = 'instagram'

// `instagr.am` is the short host the pre-2013 snippets still carry.
const hosts = ['instagram.com', 'instagr.am']

// `audio` sits where a shortcode does, under `/reels/audio/{id}`, and names a sound, not a post.
const nonShortcodeSegments = ['audio']

// Instagram's own routes sit where an account does: `share/p/{token}` carries a redirect
// token, not a shortcode, and reading it as one mints a frame that cannot load. `explore`,
// `accounts` and the other routes redirect `{route}/p/{code}` to the post, so they read as one.
const sitePathSegments = ['challenge', 'developer', 'share', 'stories']

// The account names the poster, not the post, so it is matched and dropped.
// `tv` is the retired IGTV route and `reels` the plural spelling of the reel.
const postPathRegex =
  /^\/(?:(?<handle>[A-Za-z0-9_.]+)\/)?(?<kind>p|reel|reels|tv)\/(?<shortcode>[^/]+)/i

type Post = { kind: string; shortcode: string }

const readPostUrl = (parsed: URL | undefined): Post | undefined => {
  if (!parsed) {
    return
  }

  const post = parsed.pathname.match(postPathRegex)?.groups

  if (!post) {
    return
  }

  if (post.handle && isAnyOf(post.handle, sitePathSegments)) {
    return
  }

  if (isAnyOf(post.shortcode, nonShortcodeSegments)) {
    return
  }

  const kind = post.kind.toLowerCase()

  return { kind: kind === 'reels' ? 'reel' : kind, shortcode: post.shortcode }
}

// The captioned frame renders the post's text under the picture, so which of the two a
// publisher asked for decides how much of the post a reader gets to see.
const composeEmbed = (
  post: Post,
  captioned: boolean,
  extra?: Partial<EmbedResolverResult>,
): EmbedResolverResult => {
  // The kind stays in the path: a photo's media answers 404 under `/reel/`.
  const path = `${post.kind}/${post.shortcode}`

  return {
    provider,
    id: path,
    src: `https://www.instagram.com/${path}/embed/${captioned ? 'captioned/' : ''}`,
    url: `https://www.instagram.com/${path}/`,
    ...extra,
  }
}

// Tumblr wraps the quote in a figure that repeats the post url percent-encoded.
const wrapperSelector = 'figure[data-provider="instagram"]'

const readWrapperPost = (element: Element): Post | undefined => {
  const dataUrl = attr(element.closest(wrapperSelector), 'data-url')

  const link = parseUrlOnHosts(decodeSegment(dataUrl) ?? dataUrl, hosts)

  return readPostUrl(link)
}

// Where the post is named, in the order the shapes provide it: the attribute the dialog writes,
// then any anchor in the quote, which the pre-2018 versions and every sanitized copy leave as
// the only trace.
const findPost = (element: Element): Post | undefined => {
  const permalink = parseUrlOnHosts(attr(element, 'data-instgrm-permalink'), hosts)
  const declared = readPostUrl(permalink)

  if (declared) {
    return declared
  }

  for (const anchor of element.querySelectorAll('a[href]')) {
    const link = parseUrlOnHosts(attr(anchor, 'href'), hosts)
    const post = readPostUrl(link)

    if (post) {
      return post
    }
  }
}

// `/{handle}/` on its own: the account page, as the dated byline links it.
const profilePathRegex = /^\/([A-Za-z0-9_.]+)\/?$/
// The handle as the byline spells it beside the display name, `(@handle)`. A sanitized copy
// keeps only the bare `@handle`, which is read second: inside a quote that still carries its
// caption, the first bare @token is as likely to be a mention as the author.
const bylineHandleRegex = /\(@([A-Za-z0-9_.]+)\)/

const readProfileHandle = (element: Element): string | undefined => {
  for (const anchor of element.querySelectorAll('a[href]')) {
    const parsed = parseUrlOnHosts(attr(anchor, 'href'), hosts)

    if (!parsed) {
      continue
    }

    const handle = parsed.pathname.match(profilePathRegex)?.[1]

    if (handle) {
      return handle
    }
  }
}

// The byline paragraph: the one that links the account or dates the post.
const findByline = (element: Element): Element | undefined => {
  return find(element, 'p', (paragraph) => {
    return Boolean(find(paragraph, 'time') ?? readProfileHandle(paragraph))
  })
}

const readContent = (element: Element): Partial<EmbedResolverResult> => {
  const byline = findByline(element)
  // Only beside a byline: the modern skeleton's first paragraph is its own chrome.
  // The older dialog puts the caption in a paragraph above the byline "A post shared by {name}
  // (@handle) on {date}", and the current one writes neither.
  const caption = byline ? find(element, 'p', (paragraph) => paragraph !== byline) : undefined
  const time = find(element, 'time')
  const quoted = text(element)
  const handle =
    readProfileHandle(element) ??
    quoted?.match(bylineHandleRegex)?.[1] ??
    (caption ? undefined : quoted?.match(bareHandleRegex)?.[1])

  return {
    description: text(caption),
    // The display name sits behind a localized "A post shared by" prefix in the shape that
    // still carries it, so the handle is the half every era spells the same way.
    author: handle ? atUsername(handle) : undefined,
    date: attr(time, 'datetime'),
  }
}

// Instagram's share dialog ships a post as a blockquote skeleton only its `embed.js` loader fills.
export const instagramBlockquoteEmbedResolver = createMarkupEmbedResolver(
  'blockquote.instagram-media, blockquote[data-instgrm-permalink]',
  (element) => {
    const post = findPost(element) ?? readWrapperPost(element)

    if (!post) {
      return
    }

    return composeEmbed(post, element.hasAttribute('data-instgrm-captioned'), readContent(element))
  },
)

// AMP's `<amp-instagram>` names the post in an attribute and stays empty with no AMP runtime.
export const instagramAmpEmbedResolver = createMarkupEmbedResolver(
  'amp-instagram[data-shortcode], amp-instagram[shortcode]',
  (element) => {
    const declared = attr(element, 'data-shortcode') ?? attr(element, 'shortcode')
    // The shortcode comes out of its attribute decoded, and it goes into a path.
    const shortcode = encodePathSegment(declared ?? '')

    if (!shortcode) {
      return
    }

    // The component names the media and not the path it lives at, so the frame goes through `/p/`.
    return composeEmbed({ kind: 'p', shortcode }, element.hasAttribute('data-captioned'))
  },
)

type SubstackPostAttributes = {
  instagram_id?: string
  title?: string | null
  author_name?: string | null
  thumbnail_url?: string | null
  profile_pic_url?: string | null
  timestamp?: string | null
}

// The og:title quotes the caption behind the poster's name, and the payload carries no field
// holding the caption on its own. The quote mark follows the era of the post, not its language.
const wrappedCaptionRegex = / on Instagram: (["\u201c\u201d])([\s\S]*)/

const closingQuotes = toMap({ '"': '"', '\u201c': '\u201d', '\u201d': '\u201d' })

// Instagram's og:title, which the payload carries in place of a caption field.
const readPayloadCaption = (title: string | undefined): string | undefined => {
  if (!title) {
    return
  }

  const wrapped = title.match(wrappedCaptionRegex)

  if (!wrapped) {
    return title
  }

  const [, opening, rest] = wrapped
  const closing = closingQuotes.get(opening)

  // A title cut at 64 characters ends in `…` with no closing mark, so only a fragment is left.
  if (!closing || !rest.endsWith(closing)) {
    return
  }

  return rest.slice(0, -closing.length) || undefined
}

// Only a rehosted copy: the earliest payloads carry Instagram's signed CDN url, long expired.
const readRehostedUrl = (url: Nullish<string>): string | undefined => {
  if (!url || !includesAnyOf(url, '__ss-rehost__')) {
    return
  }

  return url
}

// Substack ships an Instagram post as a childless div with the whole card as JSON in `data-attrs`.
export const instagramSubstackEmbedResolver = createMarkupEmbedResolver(
  'div.instagram-embed-wrap[data-attrs], div[data-component-name="InstagramToDOM"]',
  (element) => {
    const attributes = jsonAttr<SubstackPostAttributes>(element, 'data-attrs')
    // The payload's shortcode comes out decoded, and it goes into a path.
    const shortcode = encodePathSegment(attributes?.instagram_id ?? '')

    if (!attributes || !shortcode) {
      return
    }

    const title = attributes.title ?? undefined

    // The payload names the media and not the path it lives at, so like the AMP component the
    // frame addresses the shortcode through `/p/`.
    return composeEmbed({ kind: 'p', shortcode }, false, {
      description: readPayloadCaption(title),
      // The handle arrives bare in the older payloads and `@`-prefixed in the current ones.
      author: attributes.author_name ? atUsername(attributes.author_name) : undefined,
      avatar: readRehostedUrl(attributes.profile_pic_url),
      thumbnail: readRehostedUrl(attributes.thumbnail_url),
      date: attributes.timestamp ?? undefined,
    })
  },
)

// The frame `embed.js` builds, which exports store after render and iframe generators paste.
// Its query and hash (`cr`, `wp`, `rd`, `rp`) describe the embedding page, not the player.
// A post has no name: its words go to `description`, and the frame titles itself `Instagram`
// or nothing.
export const instagramResolveEmbed: ResolveUrlEmbed = (url) => {
  const post = readPostUrl(url)

  if (!post) {
    return
  }

  return composeEmbed(post, url.pathname.toLowerCase().includes('/embed/captioned') === true)
}

export const instagramIframeEmbedResolver = createUrlEmbedResolver(hosts, instagramResolveEmbed)

// A forum's s9e MediaEmbed helper frame, naming the post's shortcode in its url fragment.
export const instagramS9eEmbedResolver = createS9eEmbedResolver('instagram', (shortcode) => {
  const postUrl = new URL(`https://www.instagram.com/p/${encodePathSegment(shortcode)}/`)

  return instagramResolveEmbed(postUrl)
})

// The player measures itself once mounted and reports it under a `MEASURE` type. `LOADING`
// and `MOUNTED` come through the same channel without a size.
export const readInstagramHeight = (data: unknown): number | undefined => {
  if (!isPlainObject(data) || data.type !== 'MEASURE' || !isPlainObject(data.details)) {
    return
  }

  return readPixels(data.details.height)
}

export const instagramFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'description', drop: /^a post shared by\b.*$/ },
  { provider, field: 'description', drop: 'Instagram' },
]

export const instagramRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://www.instagram.com',
  readHeight: readInstagramHeight,
}
