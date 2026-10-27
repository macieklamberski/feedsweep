import { find as linkifyFind } from 'linkifyjs'
import type { DomTransform } from '../../types.js'
import { collectTextNodes, rawTextElements } from '../../utils/dom.js'
import { cleanUrl } from '../../utils/urls.js'
import { createLink } from '../../utils/widgets.js'

const urlProtocolRegex = /^https?:\/\//i
const linkifyIgnoreTags = new Set(['a', 'pre', 'code', 'kbd', 'samp', 'var', 'noscript'])

const shouldSkipElement = (element: Element): boolean => {
  const tag = element.tagName.toLowerCase()

  return linkifyIgnoreTags.has(tag) || rawTextElements.includes(tag)
}

// A bare url in running text, which the feed never wrapped in an anchor.
export const linkifyUrls: DomTransform = (context) => {
  return (document) => {
    // documentElement is only the first root-level element in a linkedom fragment.
    const textNodes = collectTextNodes(document, shouldSkipElement) as Array<ChildNode>

    for (const node of textNodes) {
      const text = node.textContent

      // Fast pre-check: skip nodes without "://".
      if (!text?.trim() || !text?.includes('://')) {
        continue
      }

      const links = linkifyFind(text).filter(
        (link) => link.type === 'url' && urlProtocolRegex.test(link.value),
      )

      if (links.length === 0) {
        continue
      }

      // Split the text node into alternating text + anchor parts.
      // E.g. "Visit https://a.com for info" becomes ["Visit ", <a>, " for info"].
      const parts: Array<Node> = []
      let lastIndex = 0

      for (const link of links) {
        if (link.start > lastIndex) {
          const before = text.slice(lastIndex, link.start)
          parts.push(document.createTextNode(before))
        }

        // cleanAnchorUrls ran before these anchors existed, so this is their only cleaning pass.
        const cleaned = cleanUrl(link.href, context)
        // The text is the URL as written. Show the cleaned one instead when cleaning
        // changed it, so a visible URL never points somewhere else.
        parts.push(createLink(document, cleaned, cleaned === link.href ? link.value : cleaned))
        lastIndex = link.end
      }

      if (lastIndex < text.length) {
        const after = text.slice(lastIndex)
        parts.push(document.createTextNode(after))
      }

      node.replaceWith(...parts)
    }
  }
}
