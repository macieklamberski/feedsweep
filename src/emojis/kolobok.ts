import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { kolobokEmojiNames } from './punbb.js'

// The Kolobok pack Drupal's Smiley module ships in `modules/smiley/packs/kolobok/`, named like
// `pardon.gif` and written with no class. Every file there is a Kolobok drawing, so the path alone
// marks it, and the set's `false` entries keep every picture.
export const kolobokEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/smiley/packs/kolobok/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: kolobokEmojiNames })
  },
}
