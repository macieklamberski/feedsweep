import { isAnyOf } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr, isElementHidden } from '../../utils/dom.js'
import * as styles from '../../utils/styles.js'

const dialogNameRegex = /lightbox|modal/i
const whitespaceRegex = /\s+/

// A form's hidden parts are its machinery, and a dialog or lightbox repeats the post as an overlay.
const isChrome = (element: Element): boolean => {
  const name = `${element.getAttribute('class') ?? ''} ${element.getAttribute('id') ?? ''}`

  return !!element.closest('form, dialog, [role="dialog"]') || dialogNameRegex.test(name)
}

// Ids a control names with `aria-controls` or a link points at with `href="#id"`.
const findReferencedIds = (document: Document): Set<string> => {
  const ids = new Set<string>()

  for (const control of document.querySelectorAll('[aria-controls]')) {
    for (const id of (control.getAttribute('aria-controls') ?? '').split(whitespaceRegex)) {
      ids.add(id)
    }
  }

  for (const link of document.querySelectorAll('a[href^="#"]')) {
    ids.add((link.getAttribute('href') ?? '').slice(1))
  }

  return ids
}

// A named slider, spoiler or tab panel, a player, find-in-page content, or a block a control names.
const isRevealable = (
  element: Element,
  revealableSelector: string,
  referencedIds: Set<string>,
): boolean => {
  return (
    isAnyOf(attr(element, 'hidden'), 'until-found') ||
    element.matches('audio, video, [role="tabpanel"]') ||
    (revealableSelector !== '' && element.matches(revealableSelector)) ||
    (element.id !== '' && referencedIds.has(element.id))
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
    const referencedIds = findReferencedIds(document)

    for (const element of document.querySelectorAll('[hidden], [style]')) {
      // Treating opacity:0 as hidden here deletes content that only fades in.
      if (!isElementHidden(element)) {
        continue
      }

      if (isRevealable(element, revealableSelector, referencedIds)) {
        unhideTree(element)
        continue
      }

      element.remove()
    }
  }
}
