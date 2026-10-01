import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Pixnet's blog emoticons, named by number or by Pixnet's own words, like `regular_smile`.
export const pixnetEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="f.pixnet.net/images/emotions/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
