import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
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

const markerSelector = 'img[smilieid]' // Discuz, vBulletin 5

// Discuz! smilies, marked by their smilieid attribute and named under `static/image/smiley/`.
export const discuzEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, img[src*="static/image/smiley/" i]`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = getDirectoryGlyph(src, 'static/image/smiley/', discuzEmojiNames)

    return resolveEmojiImage(element, {
      isStrong: element.matches(markerSelector),
      names: smiliesEmojiNames,
      glyph,
    })
  },
}
