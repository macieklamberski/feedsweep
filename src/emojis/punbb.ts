import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { glyphFromShortcode, resolveEmojiImage } from '../utils/emojis.js'

// The smilie packs PunBB and FluxBB extensions install, like `extensions/pan_smiles/img/`. Most
// are Kolobok sets named by a two-letter code, `ab.gif`, that is neither a name nor a codepoint,
// so only an alt holding a shortcode is read, and an image without one stays untouched.
export const punbbEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/extensions/" i][src*="_smiles/" i]',
  extract: (element) => {
    const glyph = glyphFromShortcode(attr(element, 'alt'))

    return resolveEmojiImage(element, { isStrong: false, glyph })
  },
}
