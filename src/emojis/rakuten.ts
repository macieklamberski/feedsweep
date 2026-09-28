import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Rakuten Blog's pictograms, with a description in the alt. They are Rakuten's own drawings.
export const rakutenEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="image.space.rakuten.co.jp/emoji/" i]',
    'img[src*="plaza.jp.rakuten-static.com/img/user/emoji/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
