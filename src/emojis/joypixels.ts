import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const hosts = [
  'cdn.jsdelivr.net/joypixels/assets/', // JoyPixels, including XenForo's emoji mode
  'cdn.jsdelivr.net/emojione/', // EmojiOne, the name JoyPixels shipped under before 5.0
]

// JoyPixels and EmojiOne from jsDelivr, both naming every file by its codepoint.
export const joypixelsEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: hosts.map((host) => `img[src*="${host}" i]`).join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
