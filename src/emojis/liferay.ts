import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, getFileStem } from '../utils/emojis.js'

// Liferay's names the forum tables lack or draw differently. Liferay binds smile.gif to `:D`,
// where every forum engine's smile is 🙂, and draws the rest as its own faces.
const liferayEmojiNames = toMap<EmojiGlyph>({
  happy: false,
  smile: false,
  big_grin: false,
  oh_my: false,
  bashful: false,
  smug: false,
  roll_eyes: false,
  suspicious: false,
  in_love: false,
  bored: false,
  closed_eyes: false,
  cold: false,
  glare: false,
  ninja: false,
})

// Liferay's message board emoticons, which carry `alt="emoticon"` and no class. The rest of its
// set passes to the smilies resolver, whose `/emoticons/` directory reads the shared names.
export const liferayEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[alt="emoticon"][src*="/emoticons/"]',
  extract: (element) => {
    const stem = getFileStem(element.getAttribute('src') ?? '').toLowerCase()
    const glyph = liferayEmojiNames.get(stem)

    if (glyph === undefined) {
      return
    }

    return glyph ? { glyph } : { custom: true }
  },
}
