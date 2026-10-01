import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Exblog's numbered pictograms, whose alt repeats the filename. They have no Unicode counterpart
// to become.
export const exblogEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="pds.exblog.jp/emoji/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
