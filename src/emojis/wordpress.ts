import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const classSelector = 'img[class~="wp-smiley" i]'

const hosts = [
  's.w.org/images/core/emoji/', // WordPress core wp-emoji-release output.
  'wp.com/wp-content/mu-plugins/wpcom-smileys/', // WordPress.com smileys, from s0, s1 and s2.
]

// WordPress core's smilies and emoji, and the WordPress.com copies of them.
export const wordpressEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [classSelector, ...hosts.map((host) => `img[src*="${host}" i]`)].join(', '),
  extract: (element) => {
    // A broken paste nests an emoji's markup inside another image's alt, which hands the class to
    // a real picture, often an Instagram photo.
    if (element.getAttribute('alt')?.trimStart().startsWith('<img')) {
      return
    }

    // Its smilie filenames are in the forum tables, since they are served from `/smilies/` too.
    const names = element.matches(classSelector) ? smiliesEmojiNames : noEmojiNames

    return resolveEmojiImage(element, { isStrong: true, names })
  },
}
