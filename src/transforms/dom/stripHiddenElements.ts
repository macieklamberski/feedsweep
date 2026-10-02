import { isAnyOf } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr, isElementHidden } from '../../utils/dom.js'
import * as styles from '../../utils/styles.js'

const dialogNameRegex = /lightbox|modal/i

const nameOf = (element: Element): string => {
  return `${element.getAttribute('class') ?? ''} ${element.getAttribute('id') ?? ''}`
}

// A form's hidden parts are its machinery, and a dialog or lightbox repeats the post as an overlay.
const isChrome = (element: Element): boolean => {
  return !!element.closest('form, dialog, [role="dialog"]') || dialogNameRegex.test(nameOf(element))
}

const isReferenced = (element: Element): boolean => {
  const id = element.id

  if (!id) {
    return false
  }

  for (const reference of element.ownerDocument.querySelectorAll('[aria-controls], a[href^="#"]')) {
    const controlled = (reference.getAttribute('aria-controls') ?? '').split(' ')

    if (controlled.includes(id) || reference.getAttribute('href') === `#${id}`) {
      return true
    }
  }

  return false
}

// A named slider, spoiler or tab panel, a player, find-in-page content, or a block a control names.
const isRevealable = (element: Element, revealableSelector: string): boolean => {
  if (isChrome(element)) {
    return false
  }

  return (
    isAnyOf(attr(element, 'hidden'), 'until-found') ||
    element.matches('audio, video, [role="tabpanel"]') ||
    element.matches(revealableSelector) ||
    isReferenced(element)
  )
}

// A slider's own slides are hidden one by one, often with no name, so the whole subtree shows.
const unhideTree = (root: Element): void => {
  for (const element of [root, ...root.querySelectorAll('[hidden], [style]')]) {
    if (!isElementHidden(element)) {
      continue
    }

    if (isChrome(element)) {
      element.remove()
      continue
    }

    element.removeAttribute('hidden')
    element.removeAttribute('aria-hidden')
    styles.removeDeclarations(element, ['display', 'visibility'])
  }
}

// An element hidden inline or by attribute is an email preheader, a JS-only widget's shell, or a
// panel a script reveals. Only the last is content.
export const stripHiddenElements: DomTransform = ({ revealableSelectors }) => {
  const revealableSelector = revealableSelectors.join(', ')

  return (document) => {
    for (const element of document.querySelectorAll('[hidden], [style]')) {
      // Treating opacity:0 as hidden here deletes content that only fades in.
      if (!isElementHidden(element)) {
        continue
      }

      if (isRevealable(element, revealableSelector)) {
        unhideTree(element)
        continue
      }

      element.remove()
    }
  }
}
