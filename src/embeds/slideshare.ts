import { getPathSegments, isAnyOf, type Nullish, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, find, text } from '../utils/dom.js'
import {
  encodePathSegment,
  getQueryParam,
  isFileName,
  parseUrlOnHosts,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const slideshareHosts = ['slideshare.net', 'slidesharecdn.com']

// The Flash wrapper spells its id `__ss_{id}` on the div and `__sse{id}` on the object inside and
// on the embed's `name`. Many carriers name the deck on the div alone.
const wrapperIdRegex = /^__ss[e_]?(\d+)$/i

// Two players, the presentation one and the document one, sharing a query.
const flashPlayerPathRegex = /\/swf\/(?:ssplayer\d?|doc_player)\.swf$/i

const deckRatio = '595/485'

const composeEmbed = (deck: string, fields?: Partial<EmbedResolverResult>): EmbedResolverResult => {
  return {
    provider: 'slideshare',
    id: deck,
    src: `https://www.slideshare.net/slideshow/embed_code/${deck}`,
    ratio: deckRatio,
    ...fields,
  }
}

export const slideshareResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, slideshareHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)
  const marker = segments.findIndex((segment) => isAnyOf(segment, 'embed_code'))

  if (marker < 0) {
    return
  }

  // `/slideshow/embed_code/key/{key}` is the current form and `/slideshow/embed_code/{id}` the
  // one it replaced, which still serves by redirecting to the key form.
  const isKeyed = isAnyOf(segments[marker + 1], 'key')
  // Some feeds put `&doc=` where the `?` belonged, so the id is cut at the `&`: an id never holds one.
  const deck = (isKeyed ? segments[marker + 2] : segments[marker + 1])?.split('&')[0]

  // SlideShare serves files on slidesharecdn.com, so a file name is an enclosure.
  if (!deck || isFileName(deck)) {
    return
  }

  return isKeyed
    ? {
        provider: 'slideshare',
        id: deck,
        src: `https://www.slideshare.net/slideshow/embed_code/key/${deck}`,
        ratio: deckRatio,
      }
    : composeEmbed(deck)
}

const captionLinkSelector = 'a[href*="slideshare.net/" i]'

const readPageSegments = (anchor: Nullish<Element>): Array<string> => {
  const parsed = parseUrlOnHosts(attr(anchor, 'href'), slideshareHosts)

  return parsed ? getPathSegments(parsed) : []
}

// The caption's links all sit on the platform's own host: the deck's page is `/{account}/{slug}`
// and its owner `/{account}`. The 2011 caption writes a bare `slideshare.net/` link in the same
// sentence.
type CaptionLinks = { page?: Element; owner?: Element }

const findCaptionLinks = (caption: Nullish<Element>): CaptionLinks => {
  // A blog plugin captions the iframe with a link to the player url, its text `slideshare.net`.
  const page = find(caption, captionLinkSelector, (anchor) => {
    const segments = readPageSegments(anchor)

    return segments.length > 1 && !segments.some((segment) => isAnyOf(segment, 'embed_code'))
  })
  const account = readPageSegments(page)[0]
  // A route word has the shape of a handle: the 2008 caption offers `slideshare.net/upload` one
  // anchor after the deck it names.
  const owner = account
    ? find(caption, captionLinkSelector, (anchor) => {
        const segments = readPageSegments(anchor)

        return segments.length === 1 && segments[0] === account
      })
    : undefined

  return { page, owner }
}

const readCaption = ({ page, owner }: CaptionLinks): Partial<EmbedResolverResult> => {
  return {
    url: attr(page, 'href'),
    title: attr(page, 'title') ?? text(page),
    author: text(owner),
  }
}

// A CMS leaves debris between the player and its caption: a `<br>`, or the empty half of a
// paragraph the parser split when the caption's `<div>` turned up inside a `<p>`.
const skipEmptyBlocks = (node: Nullish<Element>): Nullish<Element> => {
  let candidate = node

  while (
    candidate &&
    (candidate.localName === 'br' || (!candidate.firstElementChild && !text(candidate)))
  ) {
    candidate = candidate.nextElementSibling
  }

  return candidate
}

// The pre-2015 snippets wrap the player and the caption in one `__ss_{id}` div named for the deck.
// The share dialog dropped that wrapper and ships the caption as the block right after the
// iframe, where Blogger and WordPress leave it.
const findCaption = (element: Element, wrapper: Nullish<Element>): Nullish<Element> => {
  if (wrapper) {
    return wrapper
  }

  const sibling = element.nextElementSibling

  if (find(sibling, captionLinkSelector)) {
    return sibling
  }

  const parent = element.parentElement
  const candidate =
    skipEmptyBlocks(sibling) ??
    (parent?.lastElementChild === element ? skipEmptyBlocks(parent.nextElementSibling) : undefined)

  // A block naming a deck without its owner is prose about the next deck as often as a caption.
  return readCaption(findCaptionLinks(candidate)).author ? candidate : undefined
}

// An editor that rewrote the snippet moved its player out of the __ss_ div: the deck's link stays
// before the player and the owner's line after it, each beside the player or beside the block
// holding it. The deck's link is the one naming the slug the swf query names.
const readSplitCaption = (player: Element, slug: string): Partial<EmbedResolverResult> => {
  const listSiblings = (
    direction: 'previousElementSibling' | 'nextElementSibling',
  ): Array<Nullish<Element>> => {
    const siblings: Array<Nullish<Element>> = []

    for (let node = player[direction]; node; node = node[direction]) {
      siblings.push(node)
    }

    return siblings.length > 0 ? siblings : [player.parentElement?.[direction]]
  }

  const findAnchor = (
    nodes: Array<Nullish<Element>>,
    predicate: (anchor: Element) => boolean,
  ): Element | undefined => {
    for (const node of nodes) {
      if (node?.matches(captionLinkSelector) && predicate(node)) {
        return node
      }

      const anchor = find(node, captionLinkSelector, predicate)

      if (anchor) {
        return anchor
      }
    }
  }

  const before = listSiblings('previousElementSibling')
  const after = listSiblings('nextElementSibling')
  const page = findAnchor(before, (anchor) => readPageSegments(anchor)[1] === slug)
  const account = readPageSegments(page)[0]
  const owner = findAnchor([...before, ...after], (anchor) => {
    const segments = readPageSegments(anchor)

    return segments.length === 1 && segments[0] === account
  })

  // A deck's link with no owner's line beside it is prose as often as a caption.
  if (!owner) {
    return {}
  }

  return readCaption({ page, owner })
}

// Blogger lets a post run on inside the caption block, so only the run from the deck's link to
// the owner's goes, with any link to SlideShare's home page in the block.
const removeAttribution = (caption: Element, page: Element, owner: Element): void => {
  let container = page

  while (!container.contains(owner) && container.parentElement) {
    container = container.parentElement
  }

  const nodes = Array.from(container.childNodes)
  const pageIndex = nodes.findIndex((node) => node.contains(page))
  const ownerIndex = nodes.findIndex((node) => node.contains(owner))

  for (const node of nodes.slice(pageIndex, ownerIndex + 1)) {
    node.remove()
  }

  for (const anchor of Array.from(caption.querySelectorAll(captionLinkSelector))) {
    const parsed = parseUrlOnHosts(attr(anchor, 'href'), slideshareHosts)

    if (parsed && getPathSegments(parsed).length === 0) {
      anchor.remove()
    }
  }
}

const consumeCaption = (
  element: Nullish<Element>,
  wrapper: Nullish<Element>,
): Partial<EmbedResolverResult> => {
  if (!element) {
    return {}
  }

  const caption = findCaption(element, wrapper)

  if (!caption) {
    return {}
  }

  const { page, owner } = findCaptionLinks(caption)
  const fields = readCaption({ page, owner })

  // Removing the __ss_{id} wrapper would take the player inside it with the caption.
  if (!wrapper && page && owner && fields.author) {
    removeAttribution(caption, page, owner)
  }

  return fields
}

// Neither player carries the numeric id: the swf query names the deck by a document key from a
// different id space, and the iframe url by an embed key.
const readWrapper = (element: Nullish<Element>): { deck?: string; wrapper?: Element } => {
  let deck: string | undefined
  let wrapper: Element | undefined

  // The innermost match names the deck, since a snippet pasted into another one's unclosed
  // __ss_ div sits inside a wrapper named for the other deck. The wrapper is the outermost node
  // still naming that deck: the caption sits on the __ss_ div, not the __sse object inside.
  for (let node: Nullish<Element> = element; node; node = node.parentElement) {
    // An editor that rewrites the object's attributes into params moves its name there.
    const params = Array.from(node.querySelectorAll(':scope > param[name="name"]'))
    const names = [
      attr(node, 'id'),
      attr(node, 'name'),
      ...params.map((param) => attr(param, 'value')),
    ]

    for (const name of names) {
      const id = name?.match(wrapperIdRegex)?.[1]

      if (!id) {
        continue
      }

      if (deck && id !== deck) {
        return { deck, wrapper }
      }

      deck = id
      wrapper = node
    }
  }

  return { deck, wrapper }
}

// The embed url names the deck and nothing else, so its page, its name and its owner come from
// the caption the snippet ships with the iframe, the same one the Flash repair reads.
const slideshareResolveIframeEmbed: ResolveEmbed = (url, element) => {
  const resolved = slideshareResolveEmbed(url)

  if (!resolved) {
    return
  }

  const { wrapper } = readWrapper(element)
  const caption = consumeCaption(element, wrapper)
  const title = caption.title ?? attr(element, 'title')

  return { ...resolved, ...caption, title }
}

// SlideShare's player iframe, which names only the deck, and the caption the dialog ships with it.
export const slideshareIframeEmbedResolver = createUrlEmbedResolver(
  slideshareHosts,
  slideshareResolveIframeEmbed,
)

// Flash died in 2020 and these embeds have rendered nothing since, but the markup is still in
// old posts and their feeds. The numeric id in the wrapper is the same id the modern embed
// route accepts, so the dead player can be replaced by one that works.
const slideshareFlashResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !flashPlayerPathRegex.test(parsed.pathname)) {
    return
  }

  const { deck, wrapper } = readWrapper(element)

  if (!deck) {
    return
  }

  // The swf query names the deck's owner and slug, which compose the same page the wrapper
  // links to. It is the fallback for a snippet that kept the player and dropped the wrapper's
  // anchor.
  const account = getQueryParam(parsed.searchParams, 'userName')
  const slug = getQueryParam(parsed.searchParams, 'stripped_title')
  // Both come out of the query decoded, and each goes into a path segment of its own.
  const composed =
    account && slug
      ? `https://www.slideshare.net/${encodePathSegment(account)}/${encodePathSegment(slug)}`
      : undefined
  // The player names the deck itself only once the __ss_ div around it is gone.
  const isPlayer = wrapper?.localName === 'object' || wrapper?.localName === 'embed'
  const caption =
    wrapper && slug && isPlayer ? readSplitCaption(wrapper, slug) : consumeCaption(element, wrapper)

  return composeEmbed(deck, { ...caption, url: caption.url ?? composed })
}

// SlideShare's Flash player, dead since 2020, inside the __ss_{id} wrapper that names the deck.
export const slideshareFlashEmbedResolver = createUrlEmbedResolver(
  slideshareHosts,
  slideshareFlashResolveEmbed,
)
