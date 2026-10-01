import type { DomTransform } from '../../types.js'
import { blockElements, hasText, mediaSelector } from '../../utils/dom.js'

const blockInParagraphSelector = [...blockElements].map((tag) => `p ${tag}`).join(', ')
const blockSelector = [...blockElements].join(', ')

// A paragraph half left with neither text nor media renders as a blank line. One that
// kept either stays, and so does a media element left holding only its <source>.
const hasRenderableContent = (element: Element): boolean => {
  return (
    hasText(element) ||
    element.matches(mediaSelector) ||
    element.querySelector(mediaSelector) !== null
  )
}

const hoistBlockFromParagraph = (block: Element): void => {
  const paragraph = block.parentElement?.closest('p')

  if (!paragraph) {
    return
  }

  let child: Node = block
  let trailing: Element | null = null

  while (child !== paragraph) {
    const parent = child.parentNode as Element
    const clone = parent.cloneNode(false) as Element

    while (child.nextSibling) {
      clone.appendChild(child.nextSibling)
    }

    // An empty clone is a husk: an inline wrapper whose only content was the block. It is
    // not carried into the trailing half.
    if (trailing && trailing.childNodes.length > 0) {
      // The HTML parser closes an <audio> or <video> at a block's start tag, so the rest of
      // its fallback lands after it. A cloned player would render a second, sourceless box.
      if (trailing.matches(mediaSelector)) {
        clone.prepend(...trailing.childNodes)
      } else {
        clone.insertBefore(trailing, clone.firstChild)
      }
    }

    trailing = clone
    child = parent
  }

  // Detach the block along with inline ancestors it leaves empty, so the leading half
  // does not keep husks like the `<em>` that only existed to wrap it.
  let removable: Element | null = block

  while (removable && removable !== paragraph) {
    const parent: Element | null = removable.parentElement
    removable.remove()

    if (!parent || parent === paragraph || hasRenderableContent(parent)) {
      break
    }

    removable = parent
  }

  paragraph.after(block)

  // A block left in the trailing half, such as an empty embed placeholder, gets its own turn
  // and is hoisted out, so the half stays even with no text or media of its own.
  if (trailing && (hasRenderableContent(trailing) || trailing.querySelector(blockSelector))) {
    block.after(trailing)
  }

  if (!hasRenderableContent(paragraph)) {
    paragraph.remove()
  }
}

// A block inside a <p>: a browser reparses it into a split paragraph plus a stray empty one.
export const hoistBlocksFromParagraphs: DomTransform = () => {
  return (document) => {
    // Document order puts an outer block before the inner ones it holds, so hoisting it
    // carries them along and their own turn finds no enclosing paragraph left.
    for (const block of document.querySelectorAll(blockInParagraphSelector)) {
      hoistBlockFromParagraph(block)
    }
  }
}
