import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const placeholderPathRegex = /^(?:\{|%7b)smilies_path(?:\}|%7d)/i

// phpBB smilies whose `SMILIES_PATH` template variable was left unsubstituted, raw or
// percent-encoded. Its stock names are in the forum tables, since its boards serve them from
// `/smilies/` too.
export const phpbbEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="SMILIES_PATH" i]',
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''

    return resolveEmojiImage(element, {
      isStrong: false,
      names: smiliesEmojiNames,
      // A src starting with the variable is a path no host serves. One resolved against the page
      // url could still be any image, so only the names recognize it.
      isBlank: placeholderPathRegex.test(src),
    })
  },
}
