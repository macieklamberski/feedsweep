import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

// FUDforum's smilies, found by their `smiley_icons` directory.
export const fudforumEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/smiley_icons/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: false, names: smiliesEmojiNames })
  },
}
