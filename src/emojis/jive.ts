import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { resolveEmojiElement } from '../utils/emojis.js'
import { glyphFromEmojiName } from '../utils/gemoji.js'

// Jive's emoticon macro, an empty span whose picture the site's CSS draws from the name. Jive's
// own names are not a published set, so only one the shortcode table or gemoji knows resolves.
export const jiveEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[__jive_emoticon_name]',
  extract: (element) => {
    const name = attr(element, '__jive_emoticon_name')

    return resolveEmojiElement(element, {
      glyph: glyphFromEmojiName(name),
      shortcode: name ? `:${name}:` : undefined,
    })
  },
}
