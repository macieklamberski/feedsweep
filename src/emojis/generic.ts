import type { EmojiResolver } from '../types.js'
import { getFileStem, glyphFromCodepoints, resolveEmojiImage } from '../utils/emojis.js'

// The class Discourse, Vanilla, NodeBB and newer WordPress share. It is read for a glyph alt or a
// codepoint filename and never for a shortcode, since Discourse's own shortcode namespace is not
// the table's.
export const genericEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="emoji" i]',
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = glyphFromCodepoints(getFileStem(src).toLowerCase())

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
