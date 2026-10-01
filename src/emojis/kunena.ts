import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph, smiliesEmojiNames } from './smilies.js'

const directory = '/media/kunena/emoticons/'
const markerSelector = 'img[class~="bbcode_smiley" i]' // Kunena, NBBC

// Kunena's names past the stock set, and the numbered files boards upload beside it.
const kunenaEmojiNames = toMap<EmojiGlyph>({
  cheerful: false,
  silly: false,
  ermm: false,
  sideways: false,
  kissing: false,
  pinch: false,
  '9': false,
  '10': false,
  '1': false,
  '3': false,
  '2': false,
  '4': false,
  '20': false,
  yahoo: false,
})

// Kunena's smilies, marked by the bbcode_smiley class and named under its emoticons directory.
export const kunenaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, img[src*="${directory}" i]`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = getDirectoryGlyph(src, directory, kunenaEmojiNames)

    return resolveEmojiImage(element, {
      isStrong: element.matches(markerSelector),
      names: smiliesEmojiNames,
      glyph,
    })
  },
}
