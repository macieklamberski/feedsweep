import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

// Rhymix and XpressEngine editor's emoticon component. Its `msn` set is numbered drawings, and
// Rhymix's `Twemoji` set is named by codepoint.
export const rhymixEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="editor/components/emoticon/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
