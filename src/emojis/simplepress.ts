import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const markerSelector = 'img[class~="spsmiley" i]'

// Simple:Press's smilies, marked by the spSmiley class or found under its `forum-smileys/`.
export const simplePressEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, img[src*="forum-smileys/" i]`,
  extract: (element) => {
    return resolveEmojiImage(element, {
      isStrong: element.matches(markerSelector),
      names: smiliesEmojiNames,
    })
  },
}
