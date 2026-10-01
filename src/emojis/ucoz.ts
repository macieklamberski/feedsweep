import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

// uCoz smilies, marked by `rel="usm"` whatever directory the board serves them from: `/sml/`,
// `/smile/` or the site root. Pasted ones lose the attribute but keep uCoz's own host.
export const ucozEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[rel="usm" i]',
    'img[src*=".ucoz.net/sm/" i]', // The smilie sets uCoz serves every board from, on src and sN hosts
    'img[src*=".ucoz.ru/sm/" i]',
    'img[src*=".uweb.ru/sm/" i]',
    'img[src*="/.s/sm/" i]', // The same sets as a site's local copy
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames })
  },
}
