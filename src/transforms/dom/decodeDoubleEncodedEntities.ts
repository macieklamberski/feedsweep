import type { DomTransform } from '../../types.js'
import { hasAncestorWithTagName, isText, NodeFilter, opaqueElements } from '../../utils/dom.js'

// Only these entities are decoded, one match at a time, so `&unknownEntity;` and a url's
// `&param=` or `&copy=` beside them stay as the author typed them.
const doubleEncodedEntityRegex = /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi

// Entities a feed escaped twice, such as CDATA content escaped once more: the parser peels
// `&amp;amp;` to the visible text `&amp;`, so a reader shows `Tom &amp; Jerry`.
export const decodeDoubleEncodedEntities: DomTransform = () => {
  return (document) => {
    document.body.normalize()

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const decoder = document.createElement('div')

    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      if (!isText(node) || !node.data.includes('&')) {
        continue
      }

      if (hasAncestorWithTagName(node, opaqueElements)) {
        continue
      }

      // A match holds no `<`, so parsing it decodes the entity and never materializes elements.
      const decoded = node.data.replace(doubleEncodedEntityRegex, (entity) => {
        decoder.innerHTML = entity

        return decoder.textContent ?? entity
      })

      if (decoded !== node.data) {
        node.data = decoded
      }
    }
  }
}
