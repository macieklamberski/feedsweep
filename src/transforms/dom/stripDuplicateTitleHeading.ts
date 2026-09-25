import type { DomTransform } from '../../types.js'
import { isElement, isNonWhitespaceText, NodeFilter } from '../../utils/dom.js'

const headingSelector = 'h1, h2, h3, h4, h5, h6'
const mediaSelector = 'img, picture, video, audio, iframe, svg'

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ')

const markupRegex = /[&<]/

// A title can carry markup the heading's text does not: entities left by a feed that escaped
// it twice (Tumblr's `&amp;rsquo;`), or inline tags. Parsing it gives the text to compare.
const getTitleText = (document: Document, value: string): string => {
  if (!markupRegex.test(value)) {
    return value
  }

  const container = document.createElement('div')
  container.innerHTML = value

  return container.textContent ?? ''
}

// A body that opens with a heading repeating the item title shows the title twice in a reader.
export const stripDuplicateTitleHeading: DomTransform = (context) => {
  const articleTitle = context.articleTitle?.trim() ?? ''

  if (!articleTitle) {
    return () => {}
  }

  return (document) => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    )
    let heading: Element | undefined
    let text = ''

    // Text or media before the heading means the body does not open with it. An empty heading
    // is passed over: an orphan closing tag makes the parser inject one before the body.
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (isElement(node) && node.matches(headingSelector)) {
        text = normalize(node.textContent ?? '')

        if (text) {
          heading = node
          break
        }

        continue
      }

      if (isNonWhitespaceText(node) || (isElement(node) && node.matches(mediaSelector))) {
        break
      }
    }

    if (!heading) {
      return
    }

    const title = normalize(getTitleText(document, articleTitle))
    const headings = [heading]

    // A layout that breaks the title over several lines ships one heading per line, so the
    // title is only recognized once the run of headings is read as one text.
    let sibling = heading.nextElementSibling

    while (text !== title && title.startsWith(text) && sibling?.matches(headingSelector)) {
      headings.push(sibling)
      text = normalize(`${text} ${sibling.textContent ?? ''}`)
      sibling = sibling.nextElementSibling
    }

    if (text !== title) {
      return
    }

    for (const candidate of headings) {
      // A nested heading (`<h2><h1>x</h1></h2>`) would go with the outer one, so the outer stays.
      if (candidate.querySelector(headingSelector)) {
        return
      }

      // Media inside the heading would be silently deleted along with it.
      if (candidate.querySelector(mediaSelector)) {
        return
      }
    }

    for (const candidate of headings) {
      candidate.remove()
    }
  }
}
