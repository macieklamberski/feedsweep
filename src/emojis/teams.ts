import type { EmojiResolver } from '../types.js'
import { glyphFromCodepoints, resolveEmojiImage } from '../utils/emojis.js'

// The v2 folder of an emoticon with a Unicode counterpart leads with its codepoints, as in
// `1f36b_chocolatebar`. A Teams-only one carries the name alone, as in `smile`.
const codepointFolderRegex = /\/emoticons\/([^/]+)_[^/_]+\//i

// Microsoft Teams' animated emoticons, as a pasted message carries them. The file is named by its
// size under a folder named by the emoticon, and the alt is the glyph when the emoticon has one,
// or its localized name.
export const teamsEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="statics.teams.cdn.office.net/evergreen-assets/personal-expressions/" i]',
  extract: (element) => {
    const folder = element.getAttribute('src')?.match(codepointFolderRegex)?.[1] ?? ''
    const glyph = glyphFromCodepoints(folder.toLowerCase())

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
