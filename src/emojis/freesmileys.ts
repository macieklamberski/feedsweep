import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Smileys and emoticons hotlinked from the FreeSmileys.org gallery.
export const freesmileysEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="freesmileys.org/smileys/" i]',
    'img[src*="freesmileys.org/emoticons/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
