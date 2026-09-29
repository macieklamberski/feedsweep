import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// mixi's numbered emoji, with a description in the alt. They are mixi's own drawings.
export const mixiEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: ['img[src*="img.mixi.jp/img/emoji/" i]', 'img[src*="img.mixi.net/img/emoji/" i]'].join(
    ', ',
  ),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
