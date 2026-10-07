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
// hosts. Each emoticon is Yahoo's own drawing, and converts only through a universal code alt. The
// Mail `ew_icon` set holds drawings no carrier id maps, so it keeps its pictures.
export const yahooJapanEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: selectors.join(', '),
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const keepsPictures = getFileStem(src).startsWith('ew_icon_')

    return resolveEmojiImage(element, {
      isStrong: true,
      names: noEmojiNames,
      glyph: getGlyph(src),
      keepsPictures,
    })
  },
}
