import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Smileys hotlinked from the Millan.net animation gallery.
export const millannetEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="millan.net/minimations/smileys/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
