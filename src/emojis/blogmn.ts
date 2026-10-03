import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

const selectors = [
  'img[src*="blogmn.net/images/smiles/" i]',
  // The same set on the platform's other domains, where the same bloggers also publish.
  'img[src*=".coo.mn/images/smiles/" i]',
  'img[src*="help.dusal.net/images/smiles/" i]',
  'img[src*="blog.dusal.net/images/smiles/" i]',
]

// Smilies from blogmn.net's /images/smiles/ folder, mostly Yahoo Messenger's numbered drawings
// retitled in Mongolian or English, which render at full size without the emoji mark.
export const blogmnEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: selectors.join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
