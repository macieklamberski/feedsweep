import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// PivotX's emoticon sets, like its Trillian set.
export const pivotxEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/pivotx/includes/emoticons/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
