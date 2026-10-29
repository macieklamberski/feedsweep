import type { DomTransform } from '../../types.js'
import { hasText, isElement, isWhitespaceText, mediaSelector } from '../../utils/dom.js'
import { createCaptionedFigure } from '../../utils/widgets.js'

const jumpTargetSelector = '[id], [name]'

const captionContentSelector = `${mediaSelector}, table`

const isEmpty = (element: Element): boolean => {
  if (hasText(element) || element.matches(captionContentSelector)) {
    return false
  }

  return !element.querySelector(captionContentSelector)
}

// Every node in the cell outside the image is a wrapper around it, a line break, whitespace or an
// empty element.
const holdsOnlyImage = (cell: Element, image: Element): boolean => {
  for (const node of cell.childNodes) {
    if (node === image || isWhitespaceText(node)) {
      continue
    }

    if (!isElement(node)) {
      return false
    }

    if (node.contains(image)) {
      if (!holdsOnlyImage(node, image)) {
        return false
      }

      continue
    }

    // A jump target, such as Blogger's read-more marker `<a name="more">`, keeps the table, as an
    // empty element with an id or a name survives stripEmptyTags.
    if (
      !isEmpty(node) ||
      node.matches(jumpTargetSelector) ||
      node.querySelector(jumpTargetSelector)
    ) {
      return false
    }
  }

  return true
}

// The one image in the cell, with the link around it in the cell when there is one.
const readImage = (cell: Element): Element | undefined => {
  const images = cell.querySelectorAll('img')

  if (images.length !== 1) {
    return
  }

  const anchor = images[0].closest('a')
  const image = anchor && cell.contains(anchor) ? anchor : images[0]

  if (holdsOnlyImage(cell, image)) {
    return image
  }
}

// Blogger's editor captions an image with a layout table: the image in the first row and the
// caption in a `td.tr-caption` below it. A reader takes the table for data and wraps it to scroll.
export const convertBloggerCaptionTables: DomTransform = () => {
  return (document) => {
    for (const table of document.querySelectorAll('table.tr-caption-container')) {
      const rows = table.querySelectorAll(':scope > tbody > tr, :scope > tr')

      if (rows.length !== 2 || rows[0].children.length !== 1) {
        continue
      }

      const imageCell = rows[0].children[0]
      const [captionCell, ...extraCells] = rows[1].children

      if (!captionCell?.matches('td.tr-caption')) {
        continue
      }

      if (captionCell.querySelector(captionContentSelector) || !extraCells.every(isEmpty)) {
        continue
      }

      const image = readImage(imageCell)

      if (!image) {
        continue
      }

      // A caption cell left empty shows nothing under the image.
      if (!hasText(captionCell)) {
        table.replaceWith(image)
        continue
      }

      table.replaceWith(createCaptionedFigure(document, image, [...captionCell.childNodes]))
    }
  }
}
