import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Moodle's theme image server, serving the core `s` folder, which holds only emoticons. Some
// themes print the revision followed by a doubled slash.
const emoticonPathRegex = /\/theme\/image\.php\/[^/]+\/core\/[^/]+\/+s\/[^/?#]+(?:[?#]|$)/i
// Moodle before 2.0 linked the same folder as a plain file, at the root or inside a theme.
const legacyEmoticonPathRegex = /\/pix\/s\/[^/?#]+\.(?:gif|png)(?:[?#]|$)/i

// Moodle's emoticons, served by the theme image server. Their names like `smiley` and `wink` are
// drawings that name no glyph exactly.
export const moodleEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/theme/image.php/" i], img[src*="/pix/s/" i]',
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''

    if (!emoticonPathRegex.test(src) && !legacyEmoticonPathRegex.test(src)) {
      return
    }

    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
