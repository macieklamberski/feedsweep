import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Smilies from blogmn.net's /images/smiles/ folder, mostly Yahoo Messenger's numbered drawings
// retitled in Mongolian or English, which render at full size without the emoji mark.
export const blogmnEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="blogmn.net/images/smiles/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
