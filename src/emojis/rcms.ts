import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// RCMS's mobile pictograms, numbered per carrier set.
export const rcmsEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/images/modules/mobile/emoji" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
