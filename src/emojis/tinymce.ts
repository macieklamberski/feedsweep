import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

// TinyMCE 3's emotions plugin images, named after its `smiley-` prefix.
export const tinymceEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="/plugins/emotions/img/" i]',
    'img[src*="/plugins/emotions/images/" i]', // The folder older copies bundled with WordPress ship
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: false, names: smiliesEmojiNames })
  },
}
