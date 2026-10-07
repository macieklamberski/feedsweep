import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Emoticons hotlinked from the sherv.net gallery, in its `emo` and `emoticons` folders.
export const shervnetEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: ['img[src*="sherv.net/cm/emo/" i]', 'img[src*="sherv.net/cm/emoticons/" i]'].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
