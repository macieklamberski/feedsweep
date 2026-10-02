import { isAnyOf } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr, isElementHidden } from '../../utils/dom.js'
import * as styles from '../../utils/styles.js'

// Slider, gallery, spoiler, accordion and tab plugins that hide a panel until a click or a timer
// shows it: bxSlider, Revolution Slider, Unite Gallery, Essential Grid, Regular Labs Tabs and
// Accordions, Read More plugins, Wikidot tabs and collapsibles.
const revealableNameRegex =
  /accordion|carousel|collaps|esg-grid|gallery|more-text|rlta-panel|slide|spoiler|tab-?item|wiki-tab|yrm-content/i
const dialogNameRegex = /lightbox|modal/i

const controlSelector = 'button, input[type="button"], [onclick], [role="button"]'
const dialogSelector = 'dialog, [role="dialog"]'
const idTokenRegex = /[\w-]+/g
const whitespaceRegex = /\s+/
const letterOrDigitRegex = /[\p{L}\p{N}]/u

const nameOf = (element: Element): string => {
  return `${element.getAttribute('class') ?? ''} ${element.getAttribute('id') ?? ''}`
}

// A form's buttons submit it and reveal nothing.
const hasControl = (element: Element | null | undefined): boolean => {
  if (!element) {
    return false
  }

  const controls = [element, ...element.querySelectorAll(controlSelector)]

  return controls.some((control) => control.matches(controlSelector) && !control.closest('form'))
}

const hasText = (element: Element): boolean => {
  return letterOrDigitRegex.test(element.textContent ?? '')
}

const isVisibleText = (element: Element | null): boolean => {
  if (!element || isElementHidden(element) || element.matches(controlSelector)) {
    return false
  }

  return hasText(element)
}

// A code-fold widget swaps a visible block of code for a hidden stand-in holding only an icon or
// a comment marker, and one click handler names both. The stand-in repeats nothing a reader needs.
const isSwapStandIn = (element: Element): boolean => {
  if (!element.id || hasText(element)) {
    return false
  }

  for (const control of element.ownerDocument.querySelectorAll('[onclick]')) {
    const tokens: Array<string> = control.getAttribute('onclick')?.match(idTokenRegex) ?? []

    if (!tokens.includes(element.id)) {
      continue
    }

    for (const token of tokens) {
      if (token !== element.id && isVisibleText(element.ownerDocument.getElementById(token))) {
        return true
      }
    }
  }

  return false
}

// The ids a control on the page can show: by `aria-controls`, an in-page link, or a click handler.
const collectControlledIds = (document: Document): Set<string> => {
  const ids = new Set<string>()

  for (const element of document.querySelectorAll('[aria-controls], a[href^="#"], [onclick]')) {
    for (const id of (element.getAttribute('aria-controls') ?? '').split(whitespaceRegex)) {
      ids.add(id)
    }

    ids.add((element.getAttribute('href') ?? '').slice(1))

    for (const token of element.getAttribute('onclick')?.match(idTokenRegex) ?? []) {
      ids.add(token)
    }
  }

  ids.delete('')

  return ids
}

// A dialog or lightbox is chrome even when a button opens it, a control is chrome itself, and a
// form's hidden parts are its machinery.
const isChrome = (element: Element): boolean => {
  return (
    element.matches(controlSelector) ||
    !!element.closest(`form, ${dialogSelector}`) ||
    dialogNameRegex.test(nameOf(element)) ||
    isSwapStandIn(element)
  )
}

// What a reader can reveal on the publisher's page: a named slider, spoiler or tab panel, a
// player, find-in-page content, or a block a control beside it or naming its id shows.
const isRevealable = (element: Element, controlledIds: Set<string>): boolean => {
  if (isChrome(element)) {
    return false
  }

  if (isAnyOf(attr(element, 'hidden'), 'until-found')) {
    return true
  }

  if (element.matches('audio, video, [role="tabpanel"]')) {
    return true
  }

  if (revealableNameRegex.test(nameOf(element))) {
    return true
  }

  if (element.id && controlledIds.has(element.id)) {
    return true
  }

  const neighbours = [
    element.previousElementSibling,
    element.previousElementSibling?.previousElementSibling,
    element.parentElement?.previousElementSibling,
    element.nextElementSibling,
  ]

  return neighbours.some(hasControl)
}

const unhide = (element: Element): void => {
  element.removeAttribute('hidden')
  element.removeAttribute('aria-hidden')
  styles.removeDeclarations(element, ['display', 'visibility'])
}

// An element hidden inline or by attribute is an email preheader, a JS-only widget's shell, or a
// panel a script reveals. Only the last is content.
export const stripHiddenElements: DomTransform = () => {
  return (document) => {
    const controlledIds = collectControlledIds(document)

    for (const element of document.querySelectorAll('[hidden], [style]')) {
      // Treating opacity:0 as hidden here deletes content that only fades in.
      if (!isElementHidden(element)) {
        continue
      }

      if (isRevealable(element, controlledIds)) {
        unhide(element)
        continue
      }

      element.remove()
    }
  }
}
