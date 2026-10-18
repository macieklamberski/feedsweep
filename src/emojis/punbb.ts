import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { getShortcode, resolveEmojiImage } from '../utils/emojis.js'
import { kolobokEmojiNames } from './kolobok.js'

// The smilie packs PunBB and FluxBB extensions install, like `extensions/pan_smiles/img/`. Most
// are Kolobok sets, whose two-letter names are known but convert only through a shortcode alt.
export const punbbEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/extensions/" i][src*="_smiles/" i]',
  extract: (element) => {
    const glyph = getShortcode(attr(element, 'alt'))

    return resolveEmojiImage(element, { isStrong: false, names: kolobokEmojiNames, glyph })
  },
}
