import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Microsoft Teams' animated emoticons, as a pasted message carries them. The file is named by the
// emoticon's English name, and the alt is the glyph when the emoticon has one.
export const teamsEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="statics.teams.cdn.office.net/evergreen-assets/personal-expressions/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
