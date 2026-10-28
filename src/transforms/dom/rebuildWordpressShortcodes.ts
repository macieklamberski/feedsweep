import { isAnyOf, type Nullish } from 'trousse'
import { composeEmbedUrl, isVideoId } from '../../embeds/youtube.js'
import type { DomTransform, WidgetResolver } from '../../types.js'
import { collectTextNodes, rawTextElements, text } from '../../utils/dom.js'
import { createIframe, isEmbedOrMediaResolver, isResolvedIframe } from '../../utils/widgets.js'

// A `[youtube]` or `[embed]` name is matched in any case, since forum bbcode writes `[YOUTUBE]`. A
// capitalized `[Gallery …]` or `[Caption …]` is a label in prose, so those match lowercase only.
const inlinePlayerRegex =
  /\[youtube[ =](?<url>https?:\/\/[^\s\]]+)\]|\[(?<name>youtube|embed)(?:\s[^\]]*)?\](?<value>[^\s\]]+)\[\/\k<name>\]/gi
const playerOpenerRegex = /\[(?:youtube |(?<name>youtube|embed)(?:\s[^\]]*)?\]\s*)$/i
// A gallery that shares its line with other text is prose about the shortcode, and `[[gallery]]` is
// WordPress's escape for showing it as written.
const galleryLineRegex = /^[^\S\n]*\[gallery(?:\s[^\]]*)?\][^\S\n]*$/gm
const galleryCloserRegex = /\[\/gallery\]/i
const captionOpenerRegex = /\[caption(?<attributes>\s[^\]]*)?\]\s*$/
const captionCloserRegex = /\[\/caption\]/i
const captionAttributeRegex = /\bcaption=(?:"(?<caption>[^"]*)"|(?<other>\S))/
const httpUrlRegex = /^https?:\/\//i
const shortcodeIgnoreTags = ['pre', 'code']

const shouldSkipElement = (element: Element): boolean => {
  const tag = element.tagName.toLowerCase()

  return shortcodeIgnoreTags.includes(tag) || rawTextElements.includes(tag)
}

const isBlank = (node: Nullish<ChildNode>): boolean => {
  return node?.nodeType === 3 && !text(node)
}

const isTag = (node: Nullish<ChildNode>, tag: string): node is Element => {
  return node?.nodeType === 1 && (node as Element).tagName.toLowerCase() === tag
}

// An image, or a link holding nothing but an image.
const isImage = (node: Nullish<ChildNode>): node is Element => {
  if (isTag(node, 'img')) {
    return true
  }

  return (
    isTag(node, 'a') && node.children.length === 1 && isTag(node.children[0], 'img') && !text(node)
  )
}

// The player url a shortcode names: `[youtube]` takes a bare video id or a url, `[embed]` a url.
const readPlayerUrl = (name: string, value: string): string | undefined => {
  if (httpUrlRegex.test(value)) {
    return value
  }

  if (isAnyOf(name, 'youtube') && isVideoId(value)) {
    return composeEmbedUrl(value)
  }
}

// The probe is a bare iframe onto the url, so a resolver answers for it alone, and convertWidgets
// later mints the same placeholder it mints for the platform's own frame.
const createPlayer = async (
  document: Document,
  url: string | undefined,
  resolvers: ReadonlyArray<WidgetResolver>,
): Promise<Element | undefined> => {
  if (!url) {
    return
  }

  const probe = createIframe(document, url)

  if (await isResolvedIframe(probe, resolvers)) {
    return probe
  }
}

// `[youtube URL]`, `[youtube=URL]`, `[youtube]ID[/youtube]` and `[embed]URL[/embed]` written as
// text, each replaced by a player when a resolver claims its url and left as written otherwise.
const rebuildInlinePlayers = async (
  node: ChildNode,
  resolvers: ReadonlyArray<WidgetResolver>,
): Promise<void> => {
  const nodeText = node.textContent ?? ''
  const document = node.ownerDocument as Document
  const parts: Array<Node> = []
  let lastIndex = 0

  for (const match of nodeText.matchAll(inlinePlayerRegex)) {
    const { url, name, value } = match.groups ?? {}
    const playerUrl = url ?? readPlayerUrl(name, value)
    const player = await createPlayer(document, playerUrl, resolvers)

    if (!player) {
      continue
    }

    const before = document.createTextNode(nodeText.slice(lastIndex, match.index))
    parts.push(before, player)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex === 0) {
    return
  }

  const after = document.createTextNode(nodeText.slice(lastIndex))
  parts.push(after)
  node.replaceWith(...parts)
}

// `[youtube LINK]`, `[youtube]LINK[/youtube]` or `[embed]LINK[/embed]`, where the feed already
// turned the url into a link. The link's text is the url the shortcode held.
const rebuildLinkedPlayer = async (
  anchor: Element,
  resolvers: ReadonlyArray<WidgetResolver>,
): Promise<void> => {
  const before = anchor.previousSibling
  const after = anchor.nextSibling
  const opener = before?.textContent?.match(playerOpenerRegex)

  if (!before || !after || !opener) {
    return
  }

  const name = opener.groups?.name
  const closer = name ? `[/${name}]` : ']'
  const afterText = after.textContent ?? ''

  if (!afterText.toLowerCase().startsWith(closer.toLowerCase())) {
    return
  }

  const player = await createPlayer(anchor.ownerDocument, text(anchor), resolvers)

  if (!player) {
    return
  }

  before.textContent = (before.textContent ?? '').slice(0, opener.index)
  after.textContent = afterText.slice(closer.length)
  anchor.replaceWith(player)
}

// `[caption]` around an image, optionally linked, and the caption text after it, which WordPress
// renders as a figure. The caption can also come from the `caption` attribute.
const rebuildCaption = (node: ChildNode): void => {
  const opener = node.textContent?.match(captionOpenerRegex)

  if (!opener) {
    return
  }

  let image = node.nextSibling

  while (isBlank(image)) {
    image = image?.nextSibling ?? null
  }

  if (!isImage(image)) {
    return
  }

  const captionNodes: Array<ChildNode> = []
  let closer = image.nextSibling

  while (closer && !(closer.nodeType === 3 && captionCloserRegex.test(closer.textContent ?? ''))) {
    captionNodes.push(closer)
    closer = closer.nextSibling
  }

  if (!closer) {
    return
  }

  const captionAttribute = opener.groups?.attributes?.match(captionAttributeRegex)?.groups

  // A caption attribute in quotes this does not read would be lost with the shortcode.
  if (captionAttribute?.other) {
    return
  }

  const document = node.ownerDocument as Document
  const [captionText, afterText] = (closer.textContent ?? '').split(captionCloserRegex, 2)
  const content = [...captionNodes, document.createTextNode(captionText)]
  const caption = captionAttribute?.caption

  node.textContent = (node.textContent ?? '').slice(0, opener.index)
  closer.textContent = afterText

  // WordPress renders a caption shortcode with no caption as the image alone.
  if (!caption && !content.some((contentNode) => text(contentNode))) {
    return
  }

  const figure = document.createElement('figure')
  const figcaption = document.createElement('figcaption')
  image.replaceWith(figure)

  // A caption attribute wins, and WordPress keeps the text after the image inside the figure.
  if (caption) {
    figcaption.textContent = caption
    figure.append(image, ...content, figcaption)

    return
  }

  while (isTag(content[0], 'br')) {
    content.shift()?.remove()
  }

  figcaption.append(...content)
  figure.append(image, figcaption)
}

// Shortcodes WordPress left unrendered in a feed: video players, captioned images and galleries.
// A gallery names attachment ids the feed does not carry, so its text is dropped.
export const rebuildWordpressShortcodes: DomTransform = (context) => {
  const resolvers = context.widgetResolvers.filter(isEmbedOrMediaResolver)

  return async (document) => {
    const textNodes = collectTextNodes(document, shouldSkipElement) as Array<ChildNode>

    // A gallery closed by `[/gallery]` carries its own items, so nothing is dropped beside one.
    const hasClosedGallery = textNodes.some((node) => {
      return galleryCloserRegex.test(node.textContent ?? '')
    })

    for (const node of textNodes) {
      if (!node.textContent?.includes('[')) {
        continue
      }

      rebuildCaption(node)

      const withoutGalleries = (node.textContent ?? '').replace(galleryLineRegex, '')

      if (!hasClosedGallery && withoutGalleries !== node.textContent) {
        node.textContent = withoutGalleries
      }

      await rebuildInlinePlayers(node, resolvers)
    }

    for (const anchor of document.querySelectorAll('a[href]')) {
      if (anchor.closest(shortcodeIgnoreTags.join(', '))) {
        continue
      }

      await rebuildLinkedPlayer(anchor, resolvers)
    }
  }
}
