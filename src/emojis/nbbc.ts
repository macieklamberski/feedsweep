import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, getNameStem, resolveEmojiImage } from '../utils/emojis.js'
import { smilieSelector, smiliesEmojiNames } from './smilies.js'

// NBBC's names for the codes the shared table draws as another face: `8)`, `;D`, `:s` and `<_<`.
// Read ahead of the alt, since NBBC writes the code there.
const nbbcEmojiNames = toMap<EmojiGlyph>({
  bigwink: false,
  bigeyes: false,
  worry: false,
  lookleft: false,
})

// NBBC's smileys, found under any smilie directory by the names NBBC gives them.
export const nbbcEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: smilieSelector,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    // A sprite's base64 can contain `/`, leaving a stem that matches a name by accident.
    const glyph = src.startsWith('data:') ? undefined : nbbcEmojiNames.get(getNameStem(src))

    if (glyph === undefined) {
      return
    }

    return resolveEmojiImage(element, { isStrong: false, names: smiliesEmojiNames, glyph })
  },
}
