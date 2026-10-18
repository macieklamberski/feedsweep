import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// btblog's pictograms, served from each blog's own host under `/im/emoticon/`.
export const btblogEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*=".btblog.jp/im/emoticon/" i]',
    'img[src*=".buttobi.net/im/emoticon/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
