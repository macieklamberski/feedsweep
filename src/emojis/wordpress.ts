import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  glyphFromShortcode,
  isEmojiShaped,
  noEmojiNames,
  resolveEmojiElement,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const classSelector = 'img[class~="wp-smiley" i]'

const hosts = [
  's.w.org/images/core/emoji/', // WordPress core wp-emoji-release output.
  'wp.com/wp-content/mu-plugins/wpcom-smileys/', // WordPress.com smileys, from s0, s1 and s2.
]

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
    const isEmojiSet = src.includes(hosts[0]) || (alt !== undefined && isEmojiShaped(alt))

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
    const text = element.textContent?.trim() ?? ''

    // A code or a word, never prose.
    if (text.length > 20 || element.firstElementChild) {
      return
    }

    const glyph = glyphFromShortcode(title) ?? glyphFromShortcode(text)

    return resolveEmojiElement(element, { glyph, shortcode: title })
  },
}
