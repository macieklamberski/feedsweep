import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Weibo's emoticons, whose alt is a bracketed localized name. Marked, never converted.
export const weiboEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="sinaimg.cn/m/emoticon/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
