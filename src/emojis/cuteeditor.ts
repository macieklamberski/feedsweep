import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// CuteEditor's emoticons, the ASP.NET editor's  set.
export const cuteeditorEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/CuteSoft_Client/CuteEditor/images/em" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
