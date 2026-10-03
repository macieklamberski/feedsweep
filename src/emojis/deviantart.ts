import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// deviantART's emoticons, hotlinked from its static hosts by deviation descriptions and by blogs,
// with codes like `:happybounce:` or `:)` in the alt. Most names have no Unicode counterpart.
export const deviantartEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="//e.deviantart.net/emoticons/" i]',
    'img[src*="//e.deviantart.com/emoticons/" i]', // The host before deviantart.net
    'img[src*="//s.deviantart.net/emoticons/" i]',
    'img[src*="//st.deviantart.net/emoticons/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
