import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const hosts = [
  'cdn.jsdelivr.net/joypixels/assets/', // JoyPixels, including XenForo's emoji mode
  'cdn.jsdelivr.net/emojione/', // EmojiOne, the name JoyPixels shipped under before 5.0
  'cdnjs.cloudflare.com/ajax/libs/emojione/', // EmojiOne from cdnjs, as Froala's emoticons insert it
  '/wp-content/plugins/wp-emoji-one/icons/', // EmojiOne bundled by the WP Emoji One plugin
]
const markerSelector = [
  'img[class~="joypixels" i]', // What JoyPixels 5 and later write from toImage
  ...hosts.map((host) => `img[src*="${host}" i]`),
].join(', ')

// JoyPixels and EmojiOne from their CDNs, both naming every file by its codepoint.
export const joypixelsEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: markerSelector,
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
