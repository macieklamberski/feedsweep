import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// JUGEM's pictograms: the stock set under `/emoji/` and the ones each blog uploads under a folder
// named for it. Every file is a 16px drawing, and an uploader's alt is no exact hint for it.
export const jugemEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="//picto0.jugem.jp/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
