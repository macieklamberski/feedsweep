import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// The emoji images a pasted Facebook post ships.
export const facebookEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="fbcdn.net/images/emoji.php/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
