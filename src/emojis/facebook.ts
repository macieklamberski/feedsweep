import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const hosts = [
  'fbcdn.net/images/emoji.php/', // The static CDN
  'www.facebook.com/images/emoji.php/', // The same files from the main host, in older pastes
]

// The emoji images a pasted Facebook post ships.
export const facebookEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: hosts.map((host) => `img[src*="${host}" i]`).join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
