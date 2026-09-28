import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { getFileStem, glyphFromUtf8Hex, isEmojiShaped, resolveEmojiImage } from '../utils/emojis.js'

const keycapStemRegex = /^[0-9]e283a3$/i
const utf16HexRegex = /^(?:[0-9a-f]{4})+$/i
const utf16UnitRegex = /.{4}/g
// Both sets serve the same file at double density under a `_2x` suffix.
const retinaSuffixRegex = /_2x$/i

// VK names each file by the UTF-8 bytes of its glyph in hex, so f09f92a5 is 💥.
const glyphFromVkStem = (stem: string): string | undefined => {
  // A keycap keeps its digit as written before the bytes of U+20E3, as in `1e283a3` for 1️⃣.
  if (keycapStemRegex.test(stem)) {
    return `${stem[0]}️⃣`
  }

  return glyphFromUtf8Hex(stem)
}

// VK's older set names each file by the UTF-16 code units of its glyph in hex, so D83DDC47 is 👇.
const glyphFromUtf16Hex = (code: string): string | undefined => {
  if (!utf16HexRegex.test(code)) {
    return
  }

  const units = (code.match(utf16UnitRegex) ?? []).map((unit) => Number.parseInt(unit, 16))
  const glyph = String.fromCharCode(...units)

  // A lone surrogate is not emoji-shaped, so a truncated pair is refused here.
  if (!isEmojiShaped(glyph)) {
    return
  }

  return glyph
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
    const stem = getFileStem(element.getAttribute('src') ?? '').replace(retinaSuffixRegex, '')
    const glyph = element.matches(utf8Selector)
      ? glyphFromVkStem(stem)
      : glyphFromUtf16Hex(attr(element, 'emoji') ?? stem)

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
