import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// JUGEM's pictograms: the stock set under `/emoji/` and the ones each blog uploads under a folder
// named for it. They are JUGEM's own drawings, and no Unicode character stands for them.
export const jugemEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="//picto0.jugem.jp/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
