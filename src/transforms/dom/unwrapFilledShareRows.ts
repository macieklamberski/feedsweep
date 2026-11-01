import type { DomTransform } from '../../types.js'
import { hasText } from '../../utils/dom.js'

const rowSelector = 'div.ya-share2' // Yandex share2 button row.
const levelSelector = 'div.ya-share2__container, ul.ya-share2__list, li.ya-share2__item'

// A rendered button can carry the service's name as its title, so only text outside the
// buttons is the post's.
const holdsPostText = (row: Element): boolean => {
  const copy = row.cloneNode(true) as Element

  for (const button of copy.querySelectorAll('a.ya-share2__link')) {
    button.remove()
  }

  return hasText(copy)
}

// A share row copied from a rendered page with the post's own text inside it, written into the
// row in the editor or swallowed by the row left unclosed. stripNonContentElements deletes the
// row with everything inside it.
export const unwrapFilledShareRows: DomTransform = () => {
  return (document) => {
    for (const row of document.querySelectorAll(rowSelector)) {
      if (!holdsPostText(row)) {
        continue
      }

      for (const level of row.querySelectorAll(levelSelector)) {
        level.replaceWith(...level.childNodes)
      }

      row.replaceWith(...row.childNodes)
    }
  }
}
