import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// SAPO Blogs' editor and mood emoticons, with an empty alt or none. The same folder holds interface icons
// like `SHOW_CHAT.png`, so only the `EMOTICON_` files are read.
export const sapoEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="/plugins/sapoemoticons/img/EMOTICON_" i]',
    'img[src*="/plugins/sapoemotions/img/EMOTICON_" i]',
    'img[src*="/fckeditor/editor/images/smiley/sapo/EMOTICON_" i]', // The older editor
    'img[src*="blogs.sapo.pt/images/mood/EMOTICON_" i]', // A post's mood, shown with the same set
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
