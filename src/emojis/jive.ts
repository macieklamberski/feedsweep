import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { resolveEmojiElement } from '../utils/emojis.js'
import { glyphFromEmojiName } from '../utils/gemoji.js'

const nameClassRegex = /(?:^|\s)emoticon_([a-z0-9]+)(?:\s|$)/

// Jive's stock names that neither the shortcode table nor gemoji carries.
const jiveEmojiNames = toMap({
  happy: '🙂',
  silly: '😛',
  laugh: '🤣',
  shocked: '😲',
  plain: '😐',
  mischief: '😏',
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

    return resolveEmojiElement(element, {
      glyph: jiveEmojiNames.get(name?.toLowerCase() ?? '') ?? glyphFromEmojiName(name),
      shortcode: name ? `:${name}:` : undefined,
    })
  },
}
