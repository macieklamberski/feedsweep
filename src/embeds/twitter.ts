import {
  composeQuery,
  getQueryParam,
  isAnyOf,
  isHostOrSubdomainOf,
  isPlainObject,
  type Nullish,
  parseUrl,
} from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr, find, jsonAttr, keepIfMatches, setInnerHtml, text } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { digitsRegex, parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import {
  atUsername,
  createMarkupEmbedResolver,
  createS9eEmbedResolver,
  createUrlEmbedResolver,
} from '../utils/widgets.js'

const provider = 'twitter'

// `x.com`, `twitter.com` and `mobile.twitter.com` all appear, sometimes several eras in one feed.
// The proxy front-ends republish a tweet at the same path, and fxtwitter, fixupx and twittpr
// send a browser to x.com themselves.
const tweetHosts = [
  'twitter.com',
  'x.com',
  'xcancel.com',
  'fxtwitter.com',
  'vxtwitter.com',
  'fixupx.com',
  'fixvx.com',
  'twittpr.com',
]

// `platform.twitter.com` and `platform.x.com`, which serve the player, are subdomains of these.
const frameHosts = ['twitter.com', 'x.com']

// nitter as a whole host label only: a substring match claims theordinaryknitter.net.
// Nitter is self-hosted, so its instances cannot be listed, and xcancel.com is one more under a
// name of its own.
const nitterHostRegex = /(^|\.)nitter\./

const isTweetUrl = (url: URL, hosts: string | ReadonlyArray<string>): boolean => {
  return isHostOrSubdomainOf(url, hosts) || nitterHostRegex.test(url.hostname)
}

// `/{handle}/status/{id}`, with the plural `statuses` form from the earliest era. The id is its
// digit run: feeds cut the query into it, as in `{id}_src=twsrc%5Etfw`, and the tweet still plays.
const statusPathRegex = /^\/([a-zA-Z0-9_]+)\/status(?:es)?\/(\d+)/i

// The paths that name a status and carry no handle: the web client's permalink, the 2015-2017
// video frames, and the card frame before them. The frames are dead, answering 404 or a stub
// for a real id and a fabricated one alike, so the id in them is worth more than the url.
const handlelessPathRegex =
  /^\/(?:i\/(?:web\/status|videos\/tweet|videos|cards\/tfw\/v\d+)|status(?:es)?)\/(\d+)/i

// Twitter takes `i` where a handle belongs and redirects to the real one, so a status recovered
// without a handle still yields a url a reader can follow.
const handleStandIn = 'i'

type Status = { handle: string; id: string }

const readStatusUrl = (parsed: URL | undefined): Status | undefined => {
  if (!parsed) {
    return
  }

  const match = parsed.pathname.match(statusPathRegex)

  if (match) {
    return { handle: match[1], id: match[2] }
  }

  const handleless = parsed.pathname.match(handlelessPathRegex)

  if (!handleless) {
    return
  }

  return {
    handle: handleStandIn,
    id: handleless[1],
  }
}

// Where the tweet is named, in the order the shapes provide it. The dated anchor is the usual
// answer. A skeleton blockquote that carries no text names the tweet in an attribute instead,
// and a stored-after-render copy names it in the player it already built.
const findStatus = (element: Element): { status: Status; anchor?: Element } | undefined => {
  const links = element.querySelectorAll('a[href]')
  const anchors = Array.from(links).reverse()

  for (const anchor of anchors) {
    const href = attr(anchor, 'href')
    const status = readStatusUrl(parseUrlOnHosts(href, tweetHosts, isTweetUrl))

    if (status) {
      return { status, anchor }
    }
  }

  // The frame has to be the platform's own: `id` is an ordinary parameter name, so any other
  // iframe a publisher nested in the quote would otherwise name the tweet.
  const frameSrc = attr(find(element, 'iframe[src]'), 'src')
  const frame = parseUrlOnHosts(frameSrc, tweetHosts, isTweetUrl)
  const framed = getQueryParam(frame?.searchParams, 'id')
  const declared =
    attr(element, 'data-twitter-tweet-id') ??
    attr(element, 'data-tweet-id') ??
    attr(element, 'data-tweetid') ??
    framed
  // A status id is digits, the same alphabet the status path takes.
  const id = keepIfMatches(declared, digitsRegex)

  if (!id) {
    return
  }

  return { status: { handle: '', id } }
}

// The handle in the status url. The byline and the dated anchor are display text the embed
// dialog writes in the page's language, such as `13. Februar 2016`.
const readAuthor = (status: Status): string | undefined => {
  if (!status.handle || isAnyOf(status.handle, handleStandIn)) {
    return
  }

  return atUsername(status.handle)
}

// A blockquote with no paragraph of its own keeps the tweet text in the byline's paragraph,
// ahead of the line break before the byline.
const readLeadText = (byline: Nullish<Element>): string | undefined => {
  const parts: Array<string> = []

  for (const node of Array.from(byline?.childNodes ?? [])) {
    if (node.nodeName === 'BR') {
      return parts.join('').trim() || undefined
    }

    parts.push(node.textContent ?? '')
  }
}

// The tweet text: every paragraph but the one holding the dated anchor, which is the byline once
// the pipeline has wrapped it. A long tweet spans several paragraphs.
const readContent = (element: Element, status: Status, anchor: Element | undefined) => {
  const byline = anchor?.parentElement
  const paragraphs = Array.from(element.querySelectorAll('p'))
  const body = paragraphs
    .filter((paragraph) => paragraph !== byline)
    .map((paragraph) => text(paragraph))
    .filter((value) => !!value)
    .join('\n')

  return {
    description: body || readLeadText(byline),
    author: readAuthor(status),
  }
}

export const composeTwitterStatusUrl = (handle: string, id: string): string => {
  return `https://x.com/${handle}/status/${id}`
}

const composeEmbed = (status: Status, extra: Partial<EmbedResolverResult>): EmbedResolverResult => {
  return {
    provider,
    id: status.id,
    src: `https://platform.twitter.com/embed/Tweet.html${composeQuery({ id: status.id })}`,
    url: composeTwitterStatusUrl(status.handle || handleStandIn, status.id),
    ...extra,
  }
}

// Both carriers name the tweet the same four ways and hold their text in the same place, so
// the reading is one function and only the selector separates them.
const extractTweet = (element: Element): EmbedResolverResult | undefined => {
  const found = findStatus(element)

  if (!found) {
    return
  }

  return composeEmbed(found.status, readContent(element, found.status, found.anchor))
}

// Twitter's oEmbed blockquote: tweet text and a byline that only widgets.js turns into a player.
export const twitterBlockquoteEmbedResolver = createMarkupEmbedResolver(
  // `twitter-tweet` arrives compounded with a skeleton class, with the rendered marker, and inside
  // every CMS wrapper. A video tweet gets `twitter-video` from the embed dialog, on a blockquote
  // whose insides are the same.
  '.twitter-tweet, blockquote.twitter-video',
  extractTweet,
)

// AMP's amp-twitter names the tweet in an attribute and carries no text without the AMP runtime.
export const twitterAmpEmbedResolver = createMarkupEmbedResolver(
  'amp-twitter[data-tweetid]',
  extractTweet,
)

// The 2018 `TwitterToDOM` payload names its fields `html` and `author_name`, where the later ones
// write `full_text` and `name`.
type SubstackTweetAttrs = {
  url?: string
  full_text?: string
  html?: string
  name?: string
  author_name?: string
  username?: string
  profile_image_url?: string
  date?: string
  photos?: Array<{ img_url?: string }>
}

// The tweet text arrives as markup, links as `a.tweet-url` anchors and hashtags as
// `span.tweet-fake-link` spans, so it is parsed and read back as plain text.
const readTweetText = (element: Element, fullText: string | undefined): string | undefined => {
  if (!fullText) {
    return
  }

  const container = element.ownerDocument.createElement('div')
  setInnerHtml(container, fullText)

  for (const lineBreak of container.querySelectorAll('br')) {
    lineBreak.replaceWith('\n')
  }

  return text(container)
}

// Substack mirrors tweet media on its own host as a bare `pbs.substack.com/media/{key}.jpg`, and
// a signature or expiry token can only sit in the query string.
const readPhotoUrl = (photos: SubstackTweetAttrs['photos']): string | undefined => {
  const url = photos?.[0]?.img_url

  if (!url) {
    return
  }

  const parsed = parseUrl(url, placeholderBaseUrl)

  // A query carries a signature or an expiry, and a stored url with one stops resolving.
  if (parsed?.search !== '') {
    return
  }

  return url
}

const readSubstackAuthor = (attrs: SubstackTweetAttrs): string | undefined => {
  const name = (attrs.name ?? attrs.author_name)?.trim()

  if (name) {
    return name
  }

  const username = attrs.username?.trim()

  if (!username) {
    return
  }

  return atUsername(username)
}

const extractSubstackTweet = (element: Element): EmbedResolverResult | undefined => {
  const attrs = jsonAttr<SubstackTweetAttrs>(element, 'data-attrs')

  if (!attrs) {
    return
  }

  const status = readStatusUrl(parseUrlOnHosts(attrs.url, tweetHosts, isTweetUrl))

  if (!status) {
    return
  }

  return composeEmbed(status, {
    description: readTweetText(element, attrs.full_text ?? attrs.html),
    author: readSubstackAuthor(attrs),
    avatar: attrs.profile_image_url?.trim() || undefined,
    date: attrs.date?.trim() || undefined,
    thumbnail: readPhotoUrl(attrs.photos),
  })
}

// Substack's tweet component: a div whose data-attrs JSON carries the whole tweet. The earlier
// `div.tweet` holds a static copy of the tweet and no player.
export const twitterSubstackEmbedResolver = createMarkupEmbedResolver(
  // Sanitizers that strip classes keep data attributes, so some feeds carry the div with the
  // component name alone.
  'div.twitter-embed[data-attrs], div.tweet[data-attrs], div[data-component-name="Twitter2ToDOM"]',
  extractSubstackTweet,
)

// The player a stored-after-render copy already points at, and the one this resolver mints, so
// a feed carrying the frame alone still names its provider. The player has two spellings with
// the same `id` query, and both occur in real feeds.
const playerPaths = ['/embed/Tweet.html', '/embed/index.html']

// A post has no name: its words go to `description`, and the frame titles itself `Twitter Tweet`
// or `X Post`.
export const twitterResolveEmbed: ResolveUrlEmbed = (url) => {
  const framed = isAnyOf(url.pathname, playerPaths)
    ? getQueryParam(url.searchParams, 'id')
    : undefined
  const id = keepIfMatches(framed, digitsRegex)

  if (id) {
    return composeEmbed({ handle: '', id }, {})
  }

  const status = readStatusUrl(url)

  if (!status) {
    return
  }

  return composeEmbed(status, { author: readAuthor(status) })
}

// A Twitter player iframe, or a frame of the status page, which refuses framing.
// note.com puts `x.com/{handle}/status/{id}` in every one of its Twitter figures.
export const twitterIframeEmbedResolver = createUrlEmbedResolver(frameHosts, twitterResolveEmbed)

// A forum's s9e MediaEmbed helper frame, naming the status id in its url fragment.
export const twitterS9eEmbedResolver = createS9eEmbedResolver('twitter', (id) => {
  const playerUrl = new URL(`https://platform.twitter.com/embed/Tweet.html${composeQuery({ id })}`)

  return twitterResolveEmbed(playerUrl)
})

// The player reports its rendered height in a JSON-RPC envelope, unprompted, once the frame is
// in view, and again when a reader expands a truncated post. The other calls in the same
// envelope, `initialized`, `results` and `rendered`, carry no size.
export const readTwitterHeight = (data: unknown): number | undefined => {
  const call = isPlainObject(data) ? data['twttr.embed'] : undefined
  const params =
    isPlainObject(call) && call.method === 'twttr.private.resize' && Array.isArray(call.params)
      ? call.params[0]
      : undefined

  if (!isPlainObject(params)) {
    return
  }

  return readPixels(params.height)
}

export const twitterRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://platform.twitter.com',
  readHeight: readTwitterHeight,
}
