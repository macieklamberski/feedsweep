import type { DomTransform } from '../../types.js'
import { isElement } from '../../utils/dom.js'

const publishedInText = ' was originally published in '
const footerText =
  ' on Medium, where people are continuing the conversation by highlighting and responding to this story.'

const isAnchor = (node: Node): boolean => {
  return isElement(node) && node.localName === 'a'
}

const isMediumFooter = (paragraph: Element): boolean => {
  const nodes = [...paragraph.childNodes]

  if (nodes.length !== 4) {
    return false
  }

  const [post, publishedIn, publication, footer] = nodes

  return (
    isAnchor(post) &&
    publishedIn.textContent === publishedInText &&
    isAnchor(publication) &&
    footer.textContent === footerText
  )
}

// Medium ends a post that belongs to a publication with `<hr><p><a>{post}</a> was originally
// published in <a>{publication}</a> on Medium, where people are continuing the conversation…</p>`.
export const stripMediumSyndicationFooters: DomTransform = () => (document) => {
  for (const paragraph of document.querySelectorAll('p')) {
    if (!isMediumFooter(paragraph)) {
      continue
    }

    const previous = paragraph.previousSibling

    if (isElement(previous) && previous.localName === 'hr') {
      previous.remove()
    }

    paragraph.remove()
  }
}
