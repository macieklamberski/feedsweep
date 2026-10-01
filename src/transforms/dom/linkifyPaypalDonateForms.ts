import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { placeholderBaseUrl } from '../../utils/urls.js'

// Listed exactly: a www.sandbox.paypal.com form is a test button that takes no real payment.
const paypalHosts = ['paypal.com', 'www.paypal.com']

// PayPal names its donate button image files `btn_donate…`, and a publisher's own upload says
// donate in its file name. A host or folder saying donate names the site, not the button.
const donateImageRegex = /donat/i

const donateFormSelector = [
  'form[action*="paypal.com/cgi-bin/webscr"]',
  'form[action*="paypal.com/donate"]',
].join(', ')

const readDonateButtonId = (form: Element, imageSrc: string): string | undefined => {
  const action = parseUrl(attr(form, 'action') ?? '', placeholderBaseUrl)

  if (!action || !isHostOf(action, paypalHosts)) {
    return
  }

  const imageUrl = parseUrl(imageSrc, placeholderBaseUrl) ?? ''
  const imageFileName = getPathSegments(imageUrl).at(-1) ?? ''

  // On `/cgi-bin/webscr` a hosted button is a donation, a sale, a cart or a subscription alike,
  // and the donate page renders "This organization's page is broken" for any but a donation.

  if (!action.pathname.startsWith('/donate') && !donateImageRegex.test(imageFileName)) {
    return
  }

  return attr(form.querySelector('input[name="hosted_button_id"]'), 'value')
}

// A PayPal donate button: a form posting a hosted button id to PayPal, which a reader cannot
// submit. PayPal's donate page takes the same id as a link.
export const linkifyPaypalDonateForms: DomTransform = () => (document) => {
  for (const form of document.querySelectorAll(donateFormSelector)) {
    const image = form.querySelector('input[type="image"]')
    const imageSrc = attr(image, 'src')

    if (!imageSrc) {
      continue
    }

    const buttonId = readDonateButtonId(form, imageSrc)

    if (!buttonId) {
      continue
    }

    const url = new URL('https://www.paypal.com/donate/')
    url.searchParams.set('hosted_button_id', buttonId)

    const button = document.createElement('img')
    button.setAttribute('src', imageSrc)

    const alt = attr(image, 'alt')

    if (alt) {
      button.setAttribute('alt', alt)
    }

    const link = document.createElement('a')
    link.setAttribute('href', url.toString())
    link.append(button)
    image?.replaceWith(link)

    for (const input of form.querySelectorAll('input')) {
      input.remove()
    }

    // Unwrapping keeps any prose the form holds, where replacing the form would delete it.
    form.replaceWith(...form.childNodes)
  }
}
