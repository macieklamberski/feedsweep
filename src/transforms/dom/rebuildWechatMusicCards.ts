import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createImage } from '../../utils/widgets.js'

// The song and its singer, as the card prints them under the cover.
const composeCaption = (card: Element): string | undefined => {
  const name = attr(card, 'music_name')
  const singer = attr(card, 'singer')

  if (name && singer) {
    return `${name} – ${singer}`
  }

  return name ?? singer
}

// A WeChat article's music card, `mp-common-clmusic`, is an empty element whose attributes the
// article page's script paints into a player. The song plays only inside WeChat, and its
// `listenid` names no public page, so the card becomes the cover and the song it names.
export const rebuildWechatMusicCards: DomTransform = () => (document) => {
  for (const card of document.querySelectorAll('mp-common-clmusic')) {
    const cover = attr(card, 'albumurl')
    const caption = composeCaption(card)

    if (!cover && !caption) {
      continue
    }

    const figure = document.createElement('figure')

    if (cover) {
      figure.appendChild(createImage(document, { src: cover }))
    }

    if (caption) {
      const figcaption = document.createElement('figcaption')
      figcaption.textContent = caption
      figure.appendChild(figcaption)
    }

    card.replaceWith(figure)
  }
}
