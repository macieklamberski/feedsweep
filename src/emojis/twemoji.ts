import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

const hosts = [
  'cdn.jsdelivr.net/gh/twitter/twemoji', // Twemoji via jsDelivr, used by IPS and others.
  'twemoji.maxcdn.com/', // Twemoji's retired CDN, still linked from older posts.
  'twimg.com/emoji/', // Twitter / X embedded tweets, from abs and abs-0. Pastes carry translated alts.
]
const markerSelector = [
  'img[class~="twemoji" i]', // Homeland and pymdownx; twemoji.parse itself defaults to the generic `emoji`
  ...hosts.map((host) => `img[src*="${host}" i]`),
].join(', ')

// Every Twemoji file is named by its codepoint, so there is no table of names.
const names = new Map<string, string>()

// Twemoji from its CDNs, its mirrors and self-hosted copies. Every mirror names the set somewhere
// in the url, which on its own is too loose to mark an image that fails to resolve.
export const twemojiEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, img[src*="twemoji" i]`,
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: element.matches(markerSelector), names })
  },
}
