import { composePiktochartEmbedUrl } from '../../embeds/piktochart.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { parseUrlOnHosts } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

const loadingTextRegex = /^Loading(?:\.\.\.|…)$/
const loaderWrappers = ['.embed-loading-overlay', '.pikto-canvas-wrap', '.pikto-canvas']

const isLoadingGif = (element: Element): boolean => {
  const parsed = parseUrlOnHosts(attr(element, 'src'), 'piktochart.com')

  return parsed?.pathname === '/loading.gif'
}

const isLoadingText = (element: Element): boolean => {
  return element.children.length === 0 && loadingTextRegex.test(element.textContent?.trim() ?? '')
}

const removeLoaderChrome = (element: Element): void => {
  for (const image of element.querySelectorAll('img')) {
    if (!isLoadingGif(image)) {
      continue
    }

    const next = image.nextElementSibling

    if (next?.localName === 'br') {
      next.remove()
    }

    image.remove()
  }

  for (const child of element.querySelectorAll('div, p')) {
    if (isLoadingText(child)) {
      child.remove()
    }
  }

  for (const wrapper of element.querySelectorAll(loaderWrappers.join(', '))) {
    wrapper.replaceWith(...wrapper.childNodes)
  }
}

// Piktochart's script snippet: a div naming the uid, which only the loader script fills with the
// infographic. Bloggers' editors put prose inside its loading overlay, so that prose stays.
export const rebuildPiktochartEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll('div.piktowrapper-embed')) {
    const uid = attr(element, 'data-uid') ?? attr(element, 'pikto-uid')

    if (!uid) {
      continue
    }

    removeLoaderChrome(element)

    element.before(...element.childNodes)
    element.replaceWith(createIframe(document, composePiktochartEmbedUrl(uid)))
  }
}
