import type { EmojiResolver } from '../types.js'
import { type EmojiCarrier, glyphFromCarrierEmoji } from '../utils/carrierEmoji.js'
import { type EmojiGlyph, getFileStem, noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const selectors = [
  'img[src*="yimg.jp/i/jp/mesg/emoticons" i]', // Messenger's emoticons, on the Japanese host
  'img[src*="yimg.jp/images/mail/emoji/" i]', // Yahoo Japan Mail's emoji, most named by codepoint
]

// Mail's older set names each file by the carrier's letter and its own number for the emoji, like
// `ew_icon_a257` for au's 257, beside Yahoo's own drawings like `ew_icon_exclamation`.
const carrierIconRegex = /^ew_icon_([ads])(\d+)$/
const carriers: Record<string, EmojiCarrier> = {
  a: 'au',
  d: 'docomo',
  s: 'softbank',
}

const getGlyph = (src: string): EmojiGlyph | undefined => {
  const [, letter, number] = getFileStem(src).match(carrierIconRegex) ?? []

  if (!letter) {
    return
  }

  return glyphFromCarrierEmoji(carriers[letter], Number(number))
}

// Yahoo Japan's emoticons and Mail emoji, as blogs and mail pasted them straight from its image
// hosts. The emoticons and the Mail `ew_icon` set are Yahoo's own drawings, so both keep their
// pictures, and only files named by codepoint convert.
export const yahooJapanEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: selectors.join(', '),
  extract: (element) => {
    const glyph = getGlyph(element.getAttribute('src') ?? '')

    return resolveEmojiImage(element, {
      isStrong: true,
      names: noEmojiNames,
      glyph,
      keepsPictures: true,
    })
  },
}
