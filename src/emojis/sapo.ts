import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// SAPO Blogs' editor and mood emoticons, with an empty alt or none. The same folders hold
// interface icons like `SHOW_CHAT.png` and city icons like `LOCAL_LISBOA.png`, so only the
// `EMOTICON_` and `MOOD_SAPO_` files are read.
export const sapoEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="/plugins/sapoemoticons/img/EMOTICON_" i]',
    'img[src*="/plugins/sapoemotions/img/EMOTICON_" i]',
    'img[src*="/fckeditor/editor/images/smiley/sapo/EMOTICON_" i]', // The older editor
    'img[src*="/fckeditor/editor/images/smiley/sapo/MOOD_SAPO_" i]',
    'img[src*="blogs.sapo.pt/images/mood/EMOTICON_" i]', // A post's mood, shown with the same set
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
