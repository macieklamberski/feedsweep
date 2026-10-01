import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

// Odnoklassniki's emoji, named by codepoint with a density suffix, as in `1f3d0@2x.png`.
export const okEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="st.okcdn.ru/static/emoji/" i]',
    'img[src*="st.mycdn.me/static/emoji/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
