import type { EmojiResolver } from '../types.js'
import { glyphFromCarrierEmoji } from '../utils/carrierEmoji.js'
import { attr } from '../utils/dom.js'
import {
  type EmojiGlyph,
  getFileStem,
  glyphFromCodepoints,
  resolveEmojiImage,
} from '../utils/emojis.js'

const notoFilePrefixRegex = /^emoji_u/
// Google's own id, bare like `1B6` or after the drawing set it picks, like `ezweb_ne_jp/B61`.
const legacyIdRegex = /(?:^|[./])([0-9a-f]{3})$/i

const getGlyph = (element: Element): EmojiGlyph | undefined => {
  const code = attr(element, 'data-goomoji') ?? attr(element, 'goomoji')
  const src = element.getAttribute('src') ?? ''
  const [, legacyId] = (code ?? src).match(legacyIdRegex) ?? []

  if (legacyId) {
    return glyphFromCarrierEmoji('google', Number.parseInt(legacyId, 16))
  }

  const stem = getFileStem(src).replace(notoFilePrefixRegex, '')

  return glyphFromCodepoints((code ?? stem).toLowerCase())
}

// Gmail's emoji, as a mail sent on to a feed carries them, with the codepoint in `goomoji`. The
// legacy set names files by Google's own emoji id instead, which emoji4unicode maps to Unicode.
export const gmailEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="ssl.gstatic.com/mail/emoji/" i]', // The Noto set, named like emoji_u1f601
    'img[src*="mail.google.com/mail/e/" i]', // The legacy set. The rest of /mail/ is attachments
    'img[src*="youtube.com/s/gaming/emoji/" i]', // YouTube's chat emoji, the same Noto files
    'img[goomoji]',
    'img[data-goomoji]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, glyph: getGlyph(element) })
  },
}
