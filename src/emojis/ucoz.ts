import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

// uCoz smilies, marked by `rel="usm"` whatever directory the board serves them from: `/sml/`,
// `/smile/` or the site root.
export const ucozEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[rel="usm" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames })
  },
}
