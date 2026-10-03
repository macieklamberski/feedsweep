import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Noisen's smileys, hotlinked from noisen.com by its blogs and forum, with codes like `:mdr:` in
// the alt.
export const noisenEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="://noisen.com/Smileys/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
