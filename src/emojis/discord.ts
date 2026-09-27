import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Discord's server emoji, named by a snowflake id with the shortcode in the alt at most. They have
// no Unicode counterpart to become.
export const discordEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="cdn.discordapp.com/emojis/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
