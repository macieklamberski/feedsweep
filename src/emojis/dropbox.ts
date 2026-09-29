import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  getFileStem,
  glyphFromCodepoints,
  isEmojiShaped,
  resolveEmojiImage,
} from '../utils/emojis.js'

// Dropbox Paper's emoji images, with the character in data-emoji-ch and a name as the alt.
export const dropboxEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="paper.dropboxstatic.com/static/img/ace/emoji/" i]',
  extract: (element) => {
    const character = attr(element, 'data-emoji-ch')

    if (character && isEmojiShaped(character)) {
      return { glyph: character }
    }

    // Paper drops the joiner from a sequence's filename, as in `1f9d8-2640.png`, so only a single
    // codepoint names the picture.
    const stem = getFileStem(element.getAttribute('src') ?? '').toLowerCase()
    const glyph = stem.includes('-') ? undefined : glyphFromCodepoints(stem)

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
