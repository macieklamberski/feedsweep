import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { getFileStem } from '../utils/emojis.js'

// Liferay's names the forum tables lack or draw differently. Liferay binds smile.gif to `:D`,
// where every forum engine's smile is 🙂.
const liferayEmojiNames = toMap({
  happy: '🙂',
  smile: '😀',
  big_grin: '😁',
  oh_my: '😲',
  bashful: '😊',
  smug: '😏',
  roll_eyes: '🙄',
  suspicious: '🤨',
  in_love: '😍',
  bored: '🥱',
  closed_eyes: '😌',
  cold: '🥶',
  glare: '😠',
  ninja: '🥷',
})

// Liferay's message board emoticons, which carry `alt="emoticon"` and no class. The rest of its
// set passes to the smilies resolver, whose `/emoticons/` directory reads the shared names.
export const liferayEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[alt="emoticon"][src*="/emoticons/"]',
  extract: (element) => {
    const stem = getFileStem(element.getAttribute('src') ?? '').toLowerCase()
    const glyph = liferayEmojiNames.get(stem)

    if (!glyph) {
      return
    }

    return { glyph }
  },
}
