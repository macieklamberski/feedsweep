import type { DomTransform } from '../../types.js'
import {
  hasAncestorWithTagName,
  hasText,
  isBlockElement,
  isBr,
  isElement,
  isSkippable,
  isText,
  isWhitespaceText,
  playableElements,
  processContainersSelector,
} from '../../utils/dom.js'

const preOrCodeTags = new Set(['pre', 'code'])

type Chunk = {
  start: number
  end: number
  hasContent: boolean
  hasBlock: boolean
}

// A player renders on its own line, so text beside it is no edge to keep apart.
const isBlockEdge = (node: Node): boolean => {
  return isBlockElement(node) || (isElement(node) && playableElements.includes(node.localName))
}

const hasContentBetween = (children: Array<Node>, from: number, to: number): boolean => {
  for (let k = from; k < to; k++) {
    if (!isSkippable(children[k])) {
      return true
    }
  }

  return false
}

// Prose split into paragraphs by runs of two or more <br>, which no stylesheet spaces as such.
export const convertBreaksToParagraphs: DomTransform = () => {
  return (document) => {
    for (const container of document.querySelectorAll(processContainersSelector)) {
      // Fast skip: containers with no direct <br> child can never produce a paragraph split.
      let hasBr = false

      for (let node = container.firstChild; node; node = node.nextSibling) {
        if (isBr(node)) {
          hasBr = true
          break
        }
      }

      if (!hasBr) {
        continue
      }

      if (hasAncestorWithTagName(container, preOrCodeTags)) {
        continue
      }

      const children: Array<Node> = []

      for (let node = container.firstChild; node; node = node.nextSibling) {
        children.push(node)
      }

      const childCount = children.length
      const chunks: Array<Chunk> = []
      let current: Chunk = { start: 0, end: 0, hasContent: false, hasBlock: false }
      let i = 0

      while (i < childCount) {
        const child = children[i]

        if (isBr(child)) {
          // Look ahead through consecutive <br>s and whitespace-only text.
          let brCount = 1
          let j = i + 1

          while (j < childCount) {
            const next = children[j]

            if (isBr(next)) {
              brCount++
            } else if (!isWhitespaceText(next)) {
              break
            }

            j++
          }

          if (brCount >= 2) {
            current.end = i
            chunks.push(current)
            current = { start: j, end: j, hasContent: false, hasBlock: false }
            i = j
          } else {
            // Single <br>: stays inside the current chunk as a real node.
            current.hasContent = true
            i++
          }
        } else {
          if (isElement(child)) {
            current.hasContent = true

            if (isBlockElement(child)) {
              current.hasBlock = true
            }
          } else if (isText(child) && !current.hasContent && hasText(child)) {
            current.hasContent = true
          }

          i++
        }
      }

      current.end = childCount
      chunks.push(current)

      if (chunks.length < 2) {
        continue
      }

      const contentChunks = chunks.filter((chunk) => chunk.hasContent)
      const leadingRunEnds: Array<number> = []
      const trailingRunStarts: Array<number> = []

      for (const chunk of contentChunks) {
        let leadingEnd = chunk.start
        let trailingStart = chunk.end

        if (chunk.hasBlock) {
          while (!isBlockEdge(children[leadingEnd])) {
            leadingEnd++
          }

          while (!isBlockEdge(children[trailingStart - 1])) {
            trailingStart--
          }
        }

        leadingRunEnds.push(leadingEnd)
        trailingRunStarts.push(trailingStart)
      }

      // Two block chunks left bare would join the inline runs at their edges into one line, so
      // each run gets the paragraph a chunk without a block gets.
      const wrapsRunBefore: Array<boolean> = [false]

      for (let n = 1; n < contentChunks.length; n++) {
        const previous = contentChunks[n - 1]
        const chunk = contentChunks[n]

        wrapsRunBefore.push(
          previous.hasBlock &&
            chunk.hasBlock &&
            hasContentBetween(children, trailingRunStarts[n - 1], previous.end) &&
            hasContentBetween(children, chunk.start, leadingRunEnds[n]),
        )
      }

      wrapsRunBefore.push(false)

      const newChildren: Array<Node> = []

      const pushParagraph = (from: number, to: number) => {
        const paragraph = document.createElement('p')

        for (let k = from; k < to; k++) {
          paragraph.appendChild(children[k])
        }

        newChildren.push(paragraph)
      }

      for (let n = 0; n < contentChunks.length; n++) {
        const chunk = contentChunks[n]

        if (!chunk.hasBlock) {
          pushParagraph(chunk.start, chunk.end)
          continue
        }

        let start = chunk.start
        let end = chunk.end

        if (wrapsRunBefore[n]) {
          pushParagraph(start, leadingRunEnds[n])
          start = leadingRunEnds[n]
        }

        if (wrapsRunBefore[n + 1]) {
          end = trailingRunStarts[n]
        }

        for (let k = start; k < end; k++) {
          newChildren.push(children[k])
        }

        if (wrapsRunBefore[n + 1]) {
          pushParagraph(end, chunk.end)
        }
      }

      container.replaceChildren(...newChildren)
    }
  }
}
