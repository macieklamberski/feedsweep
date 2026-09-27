import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph, smiliesEmojiNames } from './smilies.js'

const directory = 'illiweb.com/fa/i/smiles/'

// Forumotion's shared set, served from its own host for every board it runs.
const forumotionEmojiNames = toMap<EmojiGlyph>({
  icon_cheers: false,
  icon_bounce: false,
  icon_flower: false,
  affraid: false,
  herz: false,
  icon_rr: false,
  icon_santa: false,
  fresse: false,
  icon_sunny: false,
  star3: false,
  icon_study: false,
  suspect: false,
  icon_king: false,
  icon_scratch: false,
  icon_basketball: false,
  icon_pale: false,
  icon_pirat: false,
  icon_tongue: false,
  icon_rabbit: false,
  icon_cyclops: false,
  drunken_smilie: false,
  icon_geek: false,
  icon_farao: false,
  icon_albino: false,
  icon_jokercolor: false,
})

// Forumotion's smilies, which every board it runs links from Forumotion's own host.
export const forumotionEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `img[src*="${directory}" i]`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = getDirectoryGlyph(src, directory, forumotionEmojiNames)

    return resolveEmojiImage(element, { isStrong: false, names: smiliesEmojiNames, glyph })
  },
}
