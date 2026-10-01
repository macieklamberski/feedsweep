import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const markerSelector = 'img[class~="bb-smiley" i]'

// EasyDiscuss smilies, marked by the bb-smiley class.
export const easydiscussEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: markerSelector,
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames })
  },
}
