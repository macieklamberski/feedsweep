import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Smilies hotlinked from greensmilies.com, a smilie gallery forums paste from.
export const greensmiliesEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="greensmilies.com/smile/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
