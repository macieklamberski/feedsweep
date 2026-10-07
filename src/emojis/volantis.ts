import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Stickers from the Volantis Hexo theme's `cdn-emoji` repository, hotlinked through jsDelivr and
// its mirrors. The files are numbered or named in Chinese, and none is named by codepoint.
// See: https://github.com/volantis-x/cdn-emoji/tree/efbaaeba56e88931259ff79f6c725ec53cc03be1.
export const volantisEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/volantis-x/cdn-emoji/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
