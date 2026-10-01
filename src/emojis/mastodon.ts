import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const markerSelector = [
  'img[class~="emojione" i]',
  'img[class~="custom-emoji" i]', // Newer
  'img[src*="/custom_emojis/" i]',
].join(', ')

// Mastodon's stock emoji, an SVG named by codepoint, as a copied post keeps it without the class.
const stockSelector = 'img[draggable="false"][src*="/emoji/" i][src$=".svg" i]'

// Mastodon's emoji. Its custom ones have no Unicode counterpart at all, so they are recognized to
// be marked, and only a codepoint filename converts.
export const mastodonEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, ${stockSelector}`,
  extract: (element) => {
    return resolveEmojiImage(element, {
      isStrong: element.matches(markerSelector),
      names: noEmojiNames,
    })
  },
}
