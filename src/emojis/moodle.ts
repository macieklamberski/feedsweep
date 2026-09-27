import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

// Moodle's theme image server, serving the core `s` folder, which holds only emoticons. Some
// themes print the revision followed by a doubled slash.
const emoticonPathRegex = /\/theme\/image\.php\/[^/]+\/core\/[^/]+\/+s\/[^/?#]+(?:[?#]|$)/i

// Moodle's emoticons, served by the theme image server. Their names like `smiley` and `wink` are
// drawings that name no glyph exactly.
export const moodleEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/theme/image.php/" i]',
  extract: (element) => {
    if (!emoticonPathRegex.test(element.getAttribute('src') ?? '')) {
      return
    }

    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
