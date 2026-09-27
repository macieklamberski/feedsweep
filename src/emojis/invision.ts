import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph, smiliesEmojiNames } from './smilies.js'

const markerSelector = [
  'img[class~="bbc_emoticon" i]', // Invision Power Board and IPS
  // Invision lazy-loads emoticons behind a spacer src with the file in data-src, which
  // fixLazyImages promotes to src before convertEmojis runs.
  'img[data-emoticon]', // Invision Power Board and IPS
  'img[class~="ipsemoji" i]', // IPS 4
].join(', ')

const directories = [
  '/uploads/emoticons/', // IPS
  '/style_emoticons/', // IPB 2 and 3
]

// Invision boards' names past the stock set, under `uploads/emoticons` and IPB 2's
// `style_emoticons`.
const invisionEmojiNames = toMap<EmojiGlyph>({
  yahoo: false,
  help: false,
  happy: false,
  drinks: false,
  excl: false,
  clapping: false,
  cray: false,
  friends: false,
  acute: false,
  dance: false,
  shok: false,
  wave: false,
  sorry: false,
  unknw: false,
  hug: false,
  give_rose: false,
  blush2: false,
  shifty: false,
  banana: false,
  wallbash: false,
  pardon: false,
  salute: false,
  wall: false,
  thinking: false,
  'untitled-1': false,
  drunk: false,
  no: false,
  flowers: false,
  ninja: false,
  party: false,
  nono: false,
  worshippy: false,
  victory: false,
  search: false,
  peace: false,
  read: false,
  fool: false,
  respect: false,
  sorcerer: false,
  wow: false,
  bday: false,
  glare: false,
  drool: false,
  coolspeak: false,
  console: false,
  peacefingers: false,
})

// Invision's emoticons, marked by their classes and named under its upload and style directories.
export const invisionEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [markerSelector, ...directories.map((path) => `img[src*="${path}" i]`)].join(', '),
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const [uploads, styles] = directories
    const glyph =
      getDirectoryGlyph(src, uploads, invisionEmojiNames) ??
      getDirectoryGlyph(src, styles, invisionEmojiNames)

    return resolveEmojiImage(element, {
      isStrong: element.matches(markerSelector),
      names: smiliesEmojiNames,
      glyph,
    })
  },
}
