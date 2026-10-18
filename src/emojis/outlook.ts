import type { EmojiResolver } from '../types.js'
import { getNameStem, noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const selectors = [
  'img[src*="//a.gfx.ms/emoji_" i]', // Outlook.com, as `emoji_1F49E.png` or `Emoji_1F49E.png`
  'img[src*=".hotmail.com/mail/" i][src*="/emoji/emoji_" i]', // Hotmail, as `emoji_02665.gif`
]

const emojiPrefixRegex = /^emoji_/

// Outlook.com's and Hotmail's emoji, pasted from a mail into a post with the image still on
// Microsoft's host. Each file is named by its codepoint after an `emoji_` prefix, and the alt is
// the emoji's name in the sender's language.
export const outlookEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: selectors.join(', '),
  extract: (element) => {
    const stem = getNameStem(element.getAttribute('src') ?? '').replace(emojiPrefixRegex, '')

    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames, stem })
  },
}
