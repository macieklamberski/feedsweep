import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph } from './smilies.js'

// Also serves BoardGameGeek's dice, tiles and stars, so only a known name marks an image.
const directory = 'geekdo-static.com/images/'

// BoardGameGeek's emoticons, drawings that name no glyph exactly.
const boardgamegeekEmojiNames = toMap<EmojiGlyph>({
  smile: false,
  biggrin: false,
})

// BoardGameGeek's emoticons, served from its static host by name.
export const boardgamegeekEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `img[src*="${directory}" i]`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = getDirectoryGlyph(src, directory, boardgamegeekEmojiNames)

    if (glyph === undefined) {
      return
    }

    return resolveEmojiImage(element, {
      isStrong: false,
      names: noEmojiNames,
      glyph,
      keepsPictures: true,
    })
  },
}
