import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, queryOrHashRegex, resolveEmojiImage } from '../utils/emojis.js'
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

// A board's own smilie, uploaded under a four-number user path and named by digits, as in
// `/users/3512/11/85/38/smiles/640583149.gif`.
const uploadRegex = /\/users\/\d+\/\d+\/\d+\/\d+\/smiles\/\d+\.\w+$/i

// Forumotion's smilies, which every board it runs links from Forumotion's own host, and the
// smilies each board uploads.
export const forumotionEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `img[src*="${directory}" i], img[src*="/users/" i][src*="/smiles/" i]`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const isUpload = uploadRegex.test(src.split(queryOrHashRegex)[0])

    if (!isUpload && !src.toLowerCase().includes(directory)) {
      return
    }

    const glyph = getDirectoryGlyph(src, directory, forumotionEmojiNames)

    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames, glyph })
  },
}
