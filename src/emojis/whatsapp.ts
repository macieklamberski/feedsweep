import type { EmojiResolver } from '../types.js'
import { getFileStem, glyphFromCodepoints, isEmojiShaped } from '../utils/emojis.js'
import { bgImage } from '../utils/styles.js'

const paintedPath = 'web.whatsapp.com/emoji/'
const paddingRegex = /^0+(?=[0-9a-f]{4})/

// WhatsApp Web pads each codepoint in a file's name to six digits, as in `0025aa_00fe0f.png`.
const glyphFromPaddedStem = (stem: string): string | undefined => {
  const parts = stem.toLowerCase().split('_')

  return glyphFromCodepoints(parts.map((part) => part.replace(paddingRegex, '')).join('_'))
}

// A message pasted from WhatsApp Web, with each emoji an empty span painted with its file as the
// background, which renders blank once the site's CSS is gone.
export const whatsappEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `span[style*="${paintedPath}" i]`,
  extract: (element) => {
    const text = element.textContent?.trim()

    if (text) {
      return isEmojiShaped(text) ? { glyph: text } : undefined
    }

    const url = bgImage(element)

    if (!url?.toLowerCase().includes(paintedPath)) {
      return
    }

    const glyph = glyphFromPaddedStem(getFileStem(url))

    return glyph ? { glyph } : { image: url }
  },
}
