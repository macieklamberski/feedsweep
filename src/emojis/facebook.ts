import type { EmojiResolver } from '../types.js'
import { attr, isElement } from '../utils/dom.js'
import {
  glyphFromShortcode,
  noEmojiNames,
  resolveEmojiElement,
  resolveEmojiImage,
} from '../utils/emojis.js'

const hosts = [
  'fbcdn.net/images/emoji.php/', // The static CDN
  'www.facebook.com/images/emoji.php/', // The same files from the main host, in older pastes
]

// The emoji images a pasted Facebook post ships.
export const facebookEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: hosts.map((host) => `img[src*="${host}" i]`).join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}

// The code Facebook's chat turned into each classic emoticon, by the class suffix it painted.
const classicCodes: Record<string, string> = {
  smile: ':)',
  frown: ':(',
  tongue: ':P',
  grin: ':D',
  gasp: ':O',
  wink: ';)',
  glasses: '8-)',
  sunglasses: '8|',
  grumpy: '>:(',
  unsure: ':/',
  cry: ":'(",
  devil: '3:)',
  angel: 'O:)',
  kiss: ':*',
  heart: '<3',
  squint: '-_-',
  confused: 'o.O',
  upset: '>:O',
  pacman: ':v',
  colonthree: ':3',
  kiki: '^_^',
  like: '(y)',
}

const classicClassRegex = /(?:^|\s)emoticon_([a-z0-9]+)(?:\s|$)/
const textClassSelector = 'span[class~="emoticon_text"]'
// Pasted posts also wrap whole paragraphs of prose in the fallback class.
const maxFallbackLength = 40

// Facebook's classic emoticon, an empty span painted from a sprite sheet the feed does not load,
// with the code in its title. The class also rides on spans pasted around whole paragraphs.
export const facebookClassicEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `span[class*="emoticon_"]:not(${textClassSelector})`,
  extract: (element) => {
    const name = attr(element, 'class')?.match(classicClassRegex)?.[1]

    if (!name) {
      return
    }

    const title = attr(element, 'title')
    const code = classicCodes[name]
    const text = element.textContent?.trim()

    if (text && text !== title && text !== code) {
      return
    }

    const glyph = glyphFromShortcode(title) ?? glyphFromShortcode(code)

    // The sibling Facebook hid from sighted readers holds the code, or a label naming the
    // emoticon like `smile emoticon` or `winkhymiö`.
    const previous = element.previousSibling
    const fallback =
      isElement(previous) && previous.matches(textClassSelector) ? previous.textContent?.trim() : ''

    if (previous && fallback) {
      if (!glyph || fallback.length > maxFallbackLength) {
        return
      }

      // Prose pasted into the class, like `er jeg å fornøyd med :D`, is neither.
      const isCode = glyphFromShortcode(fallback) === glyph
      const isLabel = fallback.toLowerCase().includes(name)

      if (!isCode && !isLabel) {
        return
      }

      previous.remove()

      return { glyph }
    }

    return resolveEmojiElement(element, { glyph, shortcode: title ?? code ?? name })
  },
}
