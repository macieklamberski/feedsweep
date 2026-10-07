import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// livedoor Blog's pictograms, with no alt. The `yahoo` folder holds au's emoji by number, and like
// every carrier set holds ids with no Unicode counterpart, so the set stays pictures.
export const livedoorEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="parts.blog.livedoor.jp/img/emoji/" i]',
    'img[src*="common.blogimg.jp/emoji/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
