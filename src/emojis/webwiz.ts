import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph, smiliesEmojiNames } from './smilies.js'

// Web Wiz Forums numbers its files. WoltLab ships other drawings under the same names in
// `/smilies/`, so these are read only from Web Wiz's `smileys/`.
const webWizEmojiNames = toMap<EmojiGlyph>({
  smiley1: false,
  smiley2: false,
  smiley3: false,
  smiley4: false,
  smiley5: false,
  smiley6: false,
  smiley7: false,
  smiley8: false,
  smiley9: false,
  smiley10: false,
  smiley11: false,
  smiley12: false,
  smiley13: false,
  smiley14: false,
  smiley15: false,
  smiley16: false,
  smiley17: false,
  smiley18: false,
  smiley19: false,
  smiley20: false,
  smiley21: false,
  smiley22: false,
  smiley23: false,
  smiley24: false,
  smiley25: false,
  smiley26: false,
  smiley27: false,
  smiley28: false,
  smiley29: false,
  smiley30: false,
  smiley31: false,
  smiley32: false,
  smiley33: false,
  smiley34: false,
  smiley35: false,
  smiley36: false,
  smiley37: false,
  smiley38: false,
  smiley39: false,
  smiley40: false,
  smiley41: false,
  smiley42: false,
})

// Web Wiz Forums' numbered smileys, often linked relative to the forum root.
export const webWizEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="smileys/" i]',
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = getDirectoryGlyph(src, 'smileys/', webWizEmojiNames)

    if (glyph === undefined) {
      return
    }

    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames, glyph })
  },
}
