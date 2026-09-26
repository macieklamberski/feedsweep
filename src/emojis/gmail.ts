import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { getFileStem, glyphFromCodepoints, resolveEmojiImage } from '../utils/emojis.js'

const notoFilePrefixRegex = /^emoji_u/

// Gmail's emoji, as a mail sent on to a feed carries them, with the codepoint in `goomoji`. The
// legacy set names files by Gmail's own code, like `1B6`, which is no codepoint, so it is marked.
export const gmailEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="ssl.gstatic.com/mail/emoji/" i]', // The Noto set, named like emoji_u1f601
    'img[src*="mail.google.com/mail/e/" i]', // The legacy set. The rest of /mail/ is attachments
    'img[src*="youtube.com/s/gaming/emoji/" i]', // YouTube's chat emoji, the same Noto files
    'img[goomoji]',
    'img[data-goomoji]',
  ].join(', '),
  extract: (element) => {
    const code = attr(element, 'data-goomoji') ?? attr(element, 'goomoji')
    const stem = getFileStem(element.getAttribute('src') ?? '').replace(notoFilePrefixRegex, '')
    const glyph = glyphFromCodepoints((code ?? stem).toLowerCase())

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
