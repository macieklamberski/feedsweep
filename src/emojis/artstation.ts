import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

// ArtStation's emoji, which carry only the generic class and a stock name in the filename.
export const artstationEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/mailer/emoji/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: false, names: smiliesEmojiNames })
  },
}
