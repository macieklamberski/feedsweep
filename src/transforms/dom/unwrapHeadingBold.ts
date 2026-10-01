import type { DomTransform } from '../../types.js'
import {
  hasText,
  headingSelector,
  isComment,
  isElement,
  isMediaElement,
  isWhitespaceText,
  mediaSelector,
} from '../../utils/dom.js'

const boldTags = new Set(['b', 'strong'])

// A whitespace-only anchor beside the bold is gone by stripEmptyTags, so it must not block this.
const isIgnorableNode = (node: Node): boolean => {
  if (isWhitespaceText(node) || isComment(node)) {
    return true
  }

  return (
    isElement(node) && !hasText(node) && !isMediaElement(node) && !node.querySelector(mediaSelector)
  )
}

const soleContentElement = (heading: Element): Element | null => {
  let found: Element | null = null

  for (const child of heading.childNodes) {
    if (isIgnorableNode(child)) {
      continue
    }

    if (found || !isElement(child)) {
      return null
    }

    found = child
  }

  return found
}

// A <b> or <strong> wrapping a heading's whole content, which headings already render bold.
export const unwrapHeadingBold: DomTransform = () => {
  return (document) => {
    const headings = document.querySelectorAll(headingSelector)

    for (const heading of headings) {
      let bold = soleContentElement(heading)

      while (bold && boldTags.has(bold.localName)) {
        while (bold.firstChild) {
          heading.insertBefore(bold.firstChild, bold)
        }

        bold.remove()
        bold = soleContentElement(heading)
      }
    }
  }
}
