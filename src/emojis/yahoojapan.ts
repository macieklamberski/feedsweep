import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const selectors = [
  'img[src*="yimg.jp/i/jp/mesg/emoticons" i]', // Messenger's emoticons, on the Japanese host
  'img[src*="yimg.jp/images/mail/emoji/" i]', // Yahoo Japan Mail's emoji, most named by codepoint
]

// Yahoo Japan's emoticons and Mail emoji, as blogs and mail pasted them straight from its image
// hosts. Each emoticon is Yahoo's own drawing, and converts only through a universal code alt.
export const yahooJapanEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: selectors.join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
