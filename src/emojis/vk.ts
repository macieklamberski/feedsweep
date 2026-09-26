import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { getFileStem, isEmojiShaped, resolveEmojiImage } from '../utils/emojis.js'

const bytePairRegex = /../g
const utf16HexRegex = /^(?:[0-9a-f]{4})+$/i
const utf16UnitRegex = /.{4}/g

const utf8Decoder = new TextDecoder('utf-8', { fatal: true })

// VK names each file by the UTF-8 bytes of its glyph in hex, so f09f92a5 is 💥.
const glyphFromUtf8Hex = (stem: string): string | undefined => {
  const pairs = stem.match(bytePairRegex) ?? []
  const bytes = Uint8Array.from(pairs, (pair) => Number.parseInt(pair, 16))

  try {
    const glyph = utf8Decoder.decode(bytes)

    return isEmojiShaped(glyph) ? glyph : undefined
  } catch {}
}

// VK's older set names each file by the UTF-16 code units of its glyph in hex, so D83DDC47 is 👇.
const glyphFromUtf16Hex = (code: string): string | undefined => {
  if (!utf16HexRegex.test(code)) {
    return
  }

  const units = (code.match(utf16UnitRegex) ?? []).map((unit) => Number.parseInt(unit, 16))
  const glyph = String.fromCharCode(...units)

  // A lone surrogate is not emoji-shaped, so a truncated pair is refused here.
  return isEmojiShaped(glyph) ? glyph : undefined
}

const utf8Selector = [
  'img[src*="vk.com/emoji/e/" i]', // The current set
  'img[src*="vk.ru/emoji/e/" i]', // The same set from VK's .ru domain
].join(', ')

// VK's emoji, as a post shared from VK carries them. The older set's sprite variant is a blank
// GIF painted by VK's CSS, so it renders nothing in a reader and keeps its code in `emoji`.
export const vkEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    utf8Selector,
    'img[src*="vk.com/images/emoji/" i]', // The older set
    'img[class~="emoji_css" i]', // The older set's sprite
  ].join(', '),
  extract: (element) => {
    const stem = getFileStem(element.getAttribute('src') ?? '')
    const glyph = element.matches(utf8Selector)
      ? glyphFromUtf8Hex(stem)
      : glyphFromUtf16Hex(attr(element, 'emoji') ?? stem)

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
