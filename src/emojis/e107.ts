import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const markerSelector = 'img[class~="e-emoticon" i]'

// e107's emoticons, marked by the e-emoticon class or found under its `/emotes/` directory.
export const e107EmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, img[src*="/emotes/" i]`,
  extract: (element) => {
    return resolveEmojiImage(element, {
      isStrong: element.matches(markerSelector),
      names: smiliesEmojiNames,
    })
  },
}
