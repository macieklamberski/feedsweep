import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Emoticons hotlinked from the SweetIM gallery, served from content.sweetim.com and its CDN.
export const sweetimEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="content.sweetim.com/sim/cpie/emoticons/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
