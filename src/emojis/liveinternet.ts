import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// LiveInternet's blog smilies, from its image hosts on li.ru.
export const liveinternetEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="li.ru/" i][src*="/images/brandnewsmilies/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
