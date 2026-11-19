import type { DomTransform } from '../../types.js'
import {
  alwaysWrapTags,
  dissolvingTags,
  hasAncestorWithTagName,
  hasText,
  inlineHostTags,
  isBlockElement,
  isComment,
  isMediaBoundary,
  paragraphContainersSelector,
} from '../../utils/dom.js'

// Bare inline runs beside block siblings in a container, which render with no paragraph spacing,
// and every run in a wrapper unwrapWrappers dissolves, whose text would otherwise land bare.
export const wrapBareInlineInParagraphs: DomTransform = () => {
  return (document) => {
    for (const container of document.querySelectorAll(paragraphContainersSelector)) {
      if (hasAncestorWithTagName(container, inlineHostTags)) {
        continue
      }

      const children: Array<Node> = []
      let hasBlockChild = false

      for (let node = container.firstChild; node; node = node.nextSibling) {
        children.push(node)

        if (isBlockElement(node)) {
          hasBlockChild = true
        }
      }

      // Non-dissolving containers (li, td, blockquote, aside) only get paragraphs
      // when content is split by a block sibling. A plain single-run cell or item
      // is left as-is.
      const shouldWrap =
        alwaysWrapTags.includes(container.localName) ||
        dissolvingTags.includes(container.localName) ||
        hasBlockChild

      if (!shouldWrap) {
        continue
      }

      const newChildren: Array<Node> = []
      let buffer: Array<Node> = []
      let wrapped = false

      const flush = () => {
        if (buffer.length === 0) {
          return
        }

        // A comment's textContent is its body, which renders nothing.
        const bufferHasText = buffer.some((node) => !isComment(node) && hasText(node))

        if (bufferHasText) {
          let start = 0
          let end = buffer.length - 1

          while (start <= end && isMediaBoundary(buffer[start])) {
            newChildren.push(buffer[start])
            start++
          }

          const trailing: Array<Node> = []

          while (end >= start && isMediaBoundary(buffer[end])) {
            trailing.unshift(buffer[end])
            end--
          }

          const paragraph = document.createElement('p')

          for (let index = start; index <= end; index++) {
            paragraph.appendChild(buffer[index])
          }

          newChildren.push(paragraph, ...trailing)
          wrapped = true
        } else {
          // Media-only / whitespace / <br>-only runs stay bare.
          for (const node of buffer) {
            newChildren.push(node)
          }
        }

        buffer = []
      }

      for (const child of children) {
        if (isBlockElement(child)) {
          flush()
          newChildren.push(child)
        } else {
          buffer.push(child)
        }
      }

      flush()

      if (wrapped) {
        container.replaceChildren(...newChildren)
      }
    }
  }
}
