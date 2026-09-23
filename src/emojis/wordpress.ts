import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { smiliesEmojiNames } from './smilies.js'

const classSelector = 'img[class~="wp-smiley" i]'

const hosts = [
  's.w.org/images/core/emoji/', // WordPress core wp-emoji-release output.
  's0.wp.com/wp-content/mu-plugins/wpcom-smileys/', // WordPress.com Twemoji assets.
]

// WordPress core's smilies and emoji, and the WordPress.com copies of them.
export const wordpressEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [classSelector, ...hosts.map((host) => `img[src*="${host}" i]`)].join(', '),
  extract: (element) => {
    // Its smilie filenames are in the forum tables, since they are served from `/smilies/` too.
    const names = element.matches(classSelector) ? smiliesEmojiNames : undefined

    return resolveEmojiImage(element, { isStrong: true, names })
  },
}
