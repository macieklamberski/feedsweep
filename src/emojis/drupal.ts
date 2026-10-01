import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const markerSelector = 'img[class~="smiley-content" i]'

// Drupal Smileys module images, marked by the smiley-content class.
export const drupalEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: markerSelector,
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames })
  },
}
