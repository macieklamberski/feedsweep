import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph, smiliesEmojiNames } from './smilies.js'

const directory = '/images/smilies/'

// JForum's stock smilies, each named by a hash.
const jforumEmojiNames = toMap<EmojiGlyph>({
  '3b63d1616c5dfcf29f8a7a031aaa7cad': false,
  '8a80c6485cd926be453217d59a84a888': false,
  '283a16da79f3aa23fe1025c96295f04f': false,
  '9d71f0541cff0a302a0309c5079e8dee': false,
  b2eb59423fbf5fa39342041237025880: false,
})

// JForum's smilies, found under its smilie directory by the hash it names each file with.
export const jforumEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `img[src*="${directory}" i]`,
  extract: (element) => {
    const glyph = getDirectoryGlyph(element.getAttribute('src') ?? '', directory, jforumEmojiNames)

    if (glyph === undefined) {
      return
    }

    return resolveEmojiImage(element, { isStrong: false, names: smiliesEmojiNames, glyph })
  },
}
