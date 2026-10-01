import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { type EmojiGlyph, glyphFromShortcode, resolveEmojiElement } from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'

const nameClassRegex = /(?:^|\s)emoticon_([a-z0-9]+)(?:\s|$)/

// Jive's stock names that neither the shortcode table nor gemoji carries.
const jiveEmojiNames = toMap<EmojiGlyph>({
  happy: false,
  silly: false,
  laugh: false,
  shocked: false,
  plain: false,
  mischief: false,
})

// Jive's emoticon, an empty span whose picture the site's CSS draws from the name: the macro
// carries it in an attribute, the rendered form in an `emoticon_<name>` class. Jive's own names
// are not a published set, so a name no table knows stays as text.
export const jiveEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'span[__jive_emoticon_name]',
    'span[class~="emoticon-inline"][class*="emoticon_"]',
  ].join(', '),
  extract: (element) => {
    const name =
      attr(element, '__jive_emoticon_name') ?? attr(element, 'class')?.match(nameClassRegex)?.[1]
    const key = name?.toLowerCase() ?? ''

    // A name Jive draws as its own face is not read as a gemoji name, and a name the shared
    // shortcode table maps keeps the glyph every other engine draws for it.
    return resolveEmojiElement(element, {
      glyph: jiveEmojiNames.get(key) ?? glyphFromShortcode(`:${key}:`) ?? glyphFromGemojiName(key),
      shortcode: name ? `:${name}:` : undefined,
    })
  },
}
