import type { EmojiResolver } from '../types.js'
import {
  getFileStem,
  glyphFromCodepoints,
  isEmojiShaped,
  noEmojiNames,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { bgImage } from '../utils/styles.js'

const hosts = [
  'cdn.jsdelivr.net/gh/twitter/twemoji', // Twemoji via jsDelivr, used by IPS and others.
  'twemoji.maxcdn.com/', // Twemoji's retired CDN, still linked from older posts.
  'twimg.com/emoji/', // Twitter / X embedded tweets, from abs and abs-0. Pastes carry translated alts.
  'pic.sopili.net/pub/emoji/twitter/', // A Twemoji mirror on sopili.net, pasted with no alt
]
const markerSelector = [
  'img[class~="twemoji" i]', // Homeland and pymdownx; twemoji.parse itself defaults to the generic `emoji`
  ...hosts.map((host) => `img[src*="${host}" i]`),
].join(', ')

// Twemoji from its CDNs, its mirrors and self-hosted copies. Every mirror names the set somewhere
// in the url, which on its own is too loose to mark an image that fails to resolve.
export const twemojiEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, img[src*="twemoji" i]`,
  extract: (element) => {
    return resolveEmojiImage(element, {
      isStrong: element.matches(markerSelector),
      names: noEmojiNames,
    })
  },
}

const paintedPath = 'twimg.com/emoji/'

// A pasted tweet's emoji as an empty span painted with the Twemoji file as its background, which
// renders blank once the site's CSS is gone.
export const twemojiElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `span[style*="${paintedPath}" i], i[style*="${paintedPath}" i]`,
  extract: (element) => {
    const text = element.textContent?.trim()

    if (text) {
      return isEmojiShaped(text) ? { glyph: text } : undefined
    }

    const url = bgImage(element)

    if (!url?.toLowerCase().includes(paintedPath)) {
      return
    }

    const glyph = glyphFromCodepoints(getFileStem(url).toLowerCase())

    return glyph ? { glyph } : { image: url }
  },
}
