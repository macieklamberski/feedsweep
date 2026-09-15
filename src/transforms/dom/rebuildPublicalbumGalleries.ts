import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createImage, createLinkedImage } from '../../utils/widgets.js'

// The two carrier classes the publicalbum plugin ships, the gallery player and the carousel.
const widgetSelector = 'div.pa-gallery-player-widget, div.pa-carousel-widget'

// The album's name and its blurb, in the order the widget declares them.
const buildCaption = (document: Document, widget: Element, href?: string): Element | undefined => {
  const title = attr(widget, 'data-title')
  const description = attr(widget, 'data-description')

  if (!title && !description) {
    return
  }

  const caption = document.createElement('figcaption')

  if (title && href) {
    const link = document.createElement('a')
    link.setAttribute('href', href)
    link.textContent = title
    caption.appendChild(link)
  } else if (title) {
    caption.appendChild(document.createTextNode(title))
  }

  if (description) {
    caption.appendChild(document.createTextNode(title ? ` ${description}` : description))
  }

  return caption
}

// A Publicalbum Google Photos album: one <object data> per photo inside a div the plugin hides
// with inline `display:none` until its script swaps in a player. A reader runs no script, so the
// album renders as nothing and every photo url in the markup is dropped unread.
export const rebuildPublicalbumGalleries: DomTransform = () => (document) => {
  for (const widget of document.querySelectorAll(widgetSelector)) {
    // The album's share url. Publishers spell it on photos.app.goo.gl and on photos.google.com.
    const href = attr(widget, 'data-link')
    const figure = document.createElement('figure')

    // `type="application/x-shockwave-flash"` with a <param name="src"> repeating `data` is
    // decoration the plugin writes over a photo url, not a Flash movie.
    for (const source of widget.querySelectorAll('object[data]')) {
      const src = attr(source, 'data')

      if (!src) {
        continue
      }

      figure.appendChild(
        href ? createLinkedImage(document, { src, href }) : createImage(document, { src }),
      )
    }

    if (!figure.childNodes.length) {
      continue
    }

    const caption = buildCaption(document, widget, href)

    if (caption) {
      figure.appendChild(caption)
    }

    widget.replaceWith(figure)
  }
}
