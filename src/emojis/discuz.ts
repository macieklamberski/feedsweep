import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
import { digitsRegex } from '../utils/urls.js'
import { getDirectoryGlyph, smiliesEmojiNames } from './smilies.js'

// Discuz! X's names, some as generic as `time` and `call`, so read only from its own directory.
const discuzEmojiNames = toMap<EmojiGlyph>({
  huffy: false,
  titter: false,
  sweat: false,
  loveliness: false,
  funk: false,
  curse: false,
  shutup: false,
  hug: false,
  victory: false,
  time: false,
  handshake: false,
  call: false,
})

const directory = 'static/image/smiley/'

// Discuz! smilies, marked by their numeric smilieid attribute and named under
// `static/image/smiley/`. vBulletin 5 writes the same attribute. A photo can carry a copied
// smilieid holding a filename, so only a number marks a smilie.
export const discuzEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `img[smilieid], img[src*="${directory}" i]`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const hasSmilieId = digitsRegex.test(element.getAttribute('smilieid') ?? '')

    if (!hasSmilieId && !src.toLowerCase().includes(directory)) {
      return
    }

    const glyph = getDirectoryGlyph(src, directory, discuzEmojiNames)

    return resolveEmojiImage(element, {
      isStrong: hasSmilieId,
      names: smiliesEmojiNames,
      glyph,
    })
  },
}
