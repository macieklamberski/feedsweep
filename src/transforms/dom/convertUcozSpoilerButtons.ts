import type { DomTransform } from '../../types.js'

const titlePrefixRegex = /^\[\+\]\s*/

// A titled uCoz spoiler names its body only in the value of its toggle button, `[+] Title`,
// which renders nothing once the body is revealed.
export const convertUcozSpoilerButtons: DomTransform = () => (document) => {
  for (const button of document.querySelectorAll('input.uSpoilerButton[value^="[+]"]')) {
    const title = document.createElement('strong')
    title.textContent = (button.getAttribute('value') ?? '').replace(titlePrefixRegex, '')
    button.replaceWith(title)
  }
}
