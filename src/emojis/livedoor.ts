import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// livedoor Blog's pictograms, with no alt. They have no Unicode counterpart to become.
export const livedoorEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="parts.blog.livedoor.jp/img/emoji/" i]',
    'img[src*="common.blogimg.jp/emoji/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
