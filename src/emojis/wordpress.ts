import type { EmojiResolver } from '../types.js'
import { attr, text } from '../utils/dom.js'
import {
  glyphFromShortcode,
  isEmojiShaped,
  noEmojiNames,
  resolveEmojiElement,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const classSelector = 'img[class~="wp-smiley" i]'

// WordPress core wp-emoji-release output.
const coreEmojiPath = 's.w.org/images/core/emoji/'
// WordPress.com smileys, from s0, s1 and s2.
const wpcomSmileysPath = 'wp.com/wp-content/mu-plugins/wpcom-smileys/'
const hosts = [coreEmojiPath, wpcomSmileysPath]

// WordPress core's smilies and emoji, and the WordPress.com copies of them.
export const wordpressEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [classSelector, ...hosts.map((host) => `img[src*="${host}" i]`)].join(', '),
  extract: (element) => {
    // A broken paste nests an emoji's markup inside another image's alt, which hands the class to
    // a real picture, often an Instagram photo. An outer file that is an emoji itself stays one.
    const src = element.getAttribute('src')?.toLowerCase() ?? ''
    const isEmojiFile = hosts.some((host) => src.includes(host))

    if (!isEmojiFile && element.getAttribute('alt')?.trimStart().startsWith('<img')) {
      return
    }

    // Its smilie filenames are in the forum tables, since they are served from `/smilies/` too.
    const names = element.matches(classSelector) ? smiliesEmojiNames : noEmojiNames
    // Core writes the glyph into the alt of every emoji, and a smilie carries its typed code, so
    // the alt tells the emoji set from the smilies even behind a lazy placeholder.
    const alt = attr(element, 'alt')
    const isEmojiSet = src.includes(coreEmojiPath) || (alt !== undefined && isEmojiShaped(alt))

    return resolveEmojiImage(element, { isStrong: true, names, keepsPictures: !isEmojiSet })
  },
}

// WordPress.com's text smiley, a span painted by its CSS with the typed code in the title. Empty,
// it renders as nothing, and some copies hold a word from the class, like `wink`.
export const wordpressElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[class~="wp-smiley" i]',
  extract: (element) => {
    const title = attr(element, 'title')
    const code = text(element) ?? ''

    // A code or a word, never prose.
    if (code.length > 20 || element.firstElementChild) {
      return
    }

    const glyph = glyphFromShortcode(title) ?? glyphFromShortcode(code)

    return resolveEmojiElement(element, { glyph, shortcode: title })
  },
}
