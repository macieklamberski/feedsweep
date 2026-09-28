import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Tistory's editor stickers, Kakao characters with no Unicode counterpart.
export const tistoryEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="t1.daumcdn.net/keditor/emoticon/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
