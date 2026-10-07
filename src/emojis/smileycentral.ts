import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Smileys hotlinked from the SmileyCentral gallery and its Japanese edition.
export const smileycentralEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="smileys.smileycentral.com/cat/" i]',
    'img[src*="images.smileycentral.jp/cat/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
