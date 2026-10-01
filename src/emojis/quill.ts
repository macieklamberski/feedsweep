import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { resolveEmojiElement } from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'

// The quill-emoji module's blot, an empty span naming its emoji by short name in `data-name`.
export const quillEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[class~="ql-emojiblot"][data-name]',
  extract: (element) => {
    const name = attr(element, 'data-name')

    return resolveEmojiElement(element, {
      glyph: glyphFromGemojiName(name),
      shortcode: name && `:${name}:`,
    })
  },
}
