import type { DomTransform } from '../../types.js'
import { collectTextNodes, isBlockElement, isBr, isElement, isText } from '../../utils/dom.js'

const timestampIgnoreTags = new Set(['a', 'pre', 'code', 'kbd', 'samp', 'var', 'script', 'style'])
const tableCellTags = ['td', 'th']

// MM:SS or HH:MM:SS, with the seconds always two digits.
const timestampToken = '(?:\\d{1,2}:)?\\d{1,2}:\\d{2}'

// The token at a line start after optional whitespace, or at a line end before it.
// An incidental "12:30" in the middle of prose is not a marker.
const lineBoundaryTimestampRegex = new RegExp(
  `(?:^|\\n)[ \\t]*(${timestampToken})|(${timestampToken})(?=[ \\t]*(?:\\n|$))`,
  'g',
)

const numericPartRegex = /^\d+$/
const leadingSpacesRegex = /^[ \t]+/
const trailingSpacesRegex = /[ \t]+$/

// The seconds a MM:SS or HH:MM:SS timestamp names, or undefined when a part is out of range.
// Minutes are unbounded in the MM:SS form, so 90:00 is valid.
export const parseTimestampSeconds = (timestamp: string): number | undefined => {
  const parts = timestamp.split(':')

  if (!parts.every((part) => numericPartRegex.test(part))) {
    return
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts.map(Number)

    if (seconds > 59) {
      return
    }

    return minutes * 60 + seconds
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(Number)

    if (minutes > 59 || seconds > 59) {
      return
    }

    return hours * 3600 + minutes * 60 + seconds
  }
}

const shouldSkipElement = (element: Element): boolean => {
  return (
    timestampIgnoreTags.has(element.tagName.toLowerCase()) || element.hasAttribute('data-timestamp')
  )
}

const isLineBoundary = (node: Node): boolean => {
  return (
    isBlockElement(node) ||
    isBr(node) ||
    (isElement(node) && tableCellTags.includes(node.localName))
  )
}

// Whether the text node's edge on one side is a line edge: nothing but spaces or tabs stand
// between it and a block boundary, a table cell, a `<br>` or a newline. Inline elements are read
// through, so `<b>noon</b> 12:30` is mid-line although the text node starts right after the `<b>`.
const isLineEdge = (node: Node, forward: boolean): boolean => {
  let current = node

  while (true) {
    const adjacent = forward ? current.nextSibling : current.previousSibling

    if (!adjacent) {
      const parent = current.parentNode

      if (!isElement(parent) || isLineBoundary(parent) || parent.localName === 'body') {
        return true
      }

      current = parent
      continue
    }

    let sibling: Node = adjacent

    while (isElement(sibling) && !isLineBoundary(sibling)) {
      const child = forward ? sibling.firstChild : sibling.lastChild

      if (!child) {
        break
      }

      sibling = child
    }

    if (isLineBoundary(sibling)) {
      return true
    }

    if (isText(sibling)) {
      const text = sibling.textContent ?? ''
      const edge = forward
        ? text.replace(leadingSpacesRegex, '')
        : text.replace(trailingSpacesRegex, '')

      if (edge) {
        return forward ? edge.startsWith('\n') : edge.endsWith('\n')
      }
    }

    current = sibling
  }
}

// A chapter list of MM:SS timestamps, plain text a reader cannot seek a player to.
export const markTimestamps: DomTransform = () => {
  return (document) => {
    // documentElement is only the first root-level element in a linkedom fragment.
    const textNodes = collectTextNodes(document, shouldSkipElement) as Array<ChildNode>

    for (const node of textNodes) {
      const text = node.textContent

      // Fast pre-check: a timestamp needs at least one colon.
      if (!text?.includes(':')) {
        continue
      }

      // A letter on a side that is not a line edge keeps `^` or `$` from matching there.
      const head = isLineEdge(node, false) ? '' : 'x'
      const tail = isLineEdge(node, true) ? '' : 'x'
      const line = `${head}${text}${tail}`

      // Split the text node into alternating text + span parts.
      // E.g. "00:00 - Intro" becomes [<span>, " - Intro"].
      const parts: Array<Node> = []
      let lastIndex = 0

      for (const match of line.matchAll(lineBoundaryTimestampRegex)) {
        const token = match[1] ?? match[2]

        if (!token) {
          continue
        }

        const seconds = parseTimestampSeconds(token)

        if (seconds === undefined) {
          continue
        }

        // match.index sits before the consumed whitespace prefix, not at the token.
        const tokenStart = (match.index ?? 0) + match[0].length - token.length - head.length

        if (tokenStart > lastIndex) {
          parts.push(document.createTextNode(text.slice(lastIndex, tokenStart)))
        }

        const span = document.createElement('span')
        span.setAttribute('data-timestamp', String(seconds))
        span.textContent = token
        parts.push(span)
        lastIndex = tokenStart + token.length
      }

      if (parts.length === 0) {
        continue
      }

      if (lastIndex < text.length) {
        parts.push(document.createTextNode(text.slice(lastIndex)))
      }

      node.replaceWith(...parts)
    }
  }
}
