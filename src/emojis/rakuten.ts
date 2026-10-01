import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { queryOrHashRegex } from '../utils/emojis.js'

// The old host answers 404 for every file, and the current one answers only over https.
const currentDirectory = 'https://plaza.jp.rakuten-static.com/img/user/emoji/'

// Rakuten Blog's pictograms, with a description in the alt. They are Rakuten's own drawings,
// served again from the current host.
export const rakutenEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="image.space.rakuten.co.jp/emoji/" i]',
    'img[src*="plaza.jp.rakuten-static.com/img/user/emoji/" i]',
  ].join(', '),
  extract: (element) => {
    const path = (element.getAttribute('src') ?? '').split(queryOrHashRegex)[0]
    const file = path.slice(path.lastIndexOf('/') + 1)

    return { image: `${currentDirectory}${file}`, alt: attr(element, 'alt') }
  },
}
