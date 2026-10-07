import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

const selectors = [
  'img[src*="spaces.live.com/rte/emoticons/" i]', // Windows Live Spaces' editor
  'img[src*="spaces.msn.com/rte/emoticons/" i]', // The same editor as MSN Spaces
  'img[src*="shared.live.com/" i][src*="/emoticons/" i]', // The same set on Windows Live's CDN
  'img[src*=".hotmail.com/mail/" i][src*="/emoticons/" i]', // Hotmail's editor
  'img[src*=".hotmail.com/mail/" i][src*="/emo/" i]', // Hotmail's later editor, as `ids_emoticon_*`
  'img[src*="messenger.msn.com/" i][src*="/emoticons/" i]', // Messenger's site and its web client
  'img[src*="/smiley/msn/" i]', // FCKeditor's stock set, copied to the editor's folder on any host
]

// MSN's emoticons, as Spaces, Hotmail, Messenger and FCKeditor serve them. Each is MSN's own
// drawing, bound to a code like `(6)` rather than a character, so the whole set keeps its pictures
// and a universal code alt stays a marked picture too.
export const msnEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: selectors.join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
