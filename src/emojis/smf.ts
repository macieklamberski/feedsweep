import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph, smiliesEmojiNames } from './smilies.js'

const directory = '/smileys/'

// SMF boards' additions to the stock set.
const smfEmojiNames = toMap<EmojiGlyph>({
  thumb: false,
  think: false,
  flowers: false,
  banghead: false,
  notworthy: false,
  drinks: false,
})

// SMF boards' own smileys. The stock set and the directory are shared with DokuWiki and Drupal,
// so an image is claimed here only by one of these names.
export const smfEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `img[src*="${directory}" i]`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = getDirectoryGlyph(src, directory, smfEmojiNames)

    if (glyph === undefined) {
      return
    }

    return resolveEmojiImage(element, { isStrong: false, names: smiliesEmojiNames, glyph })
  },
}
