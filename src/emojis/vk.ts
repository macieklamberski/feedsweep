import type { EmojiResolver } from '../types.js'
import { getFileStem, isEmojiShaped, resolveEmojiImage } from '../utils/emojis.js'

const bytePairRegex = /../g

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

// VK's emoji, as a post shared from VK carries them.
export const vkEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="vk.com/emoji/e/" i]',
  extract: (element) => {
    const glyph = glyphFromUtf8Hex(getFileStem(element.getAttribute('src') ?? ''))

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
