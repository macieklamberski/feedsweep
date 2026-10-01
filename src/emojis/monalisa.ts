import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const markerSelector = 'img[class~="wpml_ico" i]'

// WP Monalisa's smilies, marked by the wpml_ico class.
export const monalisaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: markerSelector,
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames })
  },
}
