import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { resolveEmojiElement } from '../utils/emojis.js'
import { glyphFromEmojiName } from '../utils/gemoji.js'

const idPrefixRegex = /^lia_/
const hyphenRegex = /-/g

// Khoros' emoji element, empty and named by CLDR short name twice: snake case in the title,
// which some communities localize, and hyphenated in an id that stays English.
export const khorosEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'li-emoji',
  extract: (element) => {
    const title = attr(element, 'title')
    const id = attr(element, 'id')?.replace(idPrefixRegex, '').replace(hyphenRegex, '_')
    const glyph = glyphFromEmojiName(title) ?? glyphFromEmojiName(id)

    return resolveEmojiElement(element, { glyph, shortcode: title ?? (id ? `:${id}:` : undefined) })
  },
}
