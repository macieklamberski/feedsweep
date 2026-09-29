import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { isEmojiShaped, resolveEmojiElement } from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'

// TipTap's emoji node, holding the glyph in `data-emoji` or naming it by gemoji name in
// `data-name`. Empty, it renders as nothing.
export const tiptapEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[data-type="emoji"]',
  extract: (element) => {
    const character = attr(element, 'data-emoji')
    const name = attr(element, 'data-name')
    const glyph = character && isEmojiShaped(character) ? character : glyphFromGemojiName(name)

    return resolveEmojiElement(element, { glyph, shortcode: name && `:${name}:` })
  },
}
