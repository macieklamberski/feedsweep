import type { DomTransform } from '../../types.js'
import { batchSelectors } from '../../utils/dom.js'

// Subscribe forms, share buttons, ad slots and dead JS placeholders: chrome, not the post.
export const stripNonContentElements: DomTransform = ({ nonContentSelectors }) => {
  const selectors = batchSelectors(nonContentSelectors)

  return (document) => {
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        element.remove()
      }
    }
  }
}
