import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Mastodon's custom emoji, which have no Unicode counterpart at all. Recognized so they can be
// marked, never converted.
export const mastodonEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[class~="emojione" i]',
    'img[class~="custom-emoji" i]', // Newer
    'img[src*="/custom_emojis/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
