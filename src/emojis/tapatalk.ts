import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Tapatalk's numbered emoji, with no alt. The number is Tapatalk's own and names no codepoint.
export const tapatalkEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="emoji.tapatalk-cdn.com/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
