import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// The class Discourse, Vanilla, NodeBB and newer WordPress share. It is read for a glyph alt and
// never for a shortcode, since Discourse's own shortcode namespace is not the table's.
export const genericEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="emoji" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
