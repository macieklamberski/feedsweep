import type { EmojiResolver } from '../types.js'
import { getNameStem, resolveEmojiImage } from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'

// Homepaging's emoji, a WordPress site builder that names each file by its gemoji name, as in
// `person/relaxed.png`.
export const homepagingEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/homepaging/wp-content/common/emoji/" i]',
  extract: (element) => {
    const stem = getNameStem(element.getAttribute('src') ?? '')
    const glyph = glyphFromGemojiName(stem)

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
