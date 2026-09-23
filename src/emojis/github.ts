import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const hosts = [
  'githubassets.com/images/icons/emoji/', // GitHub README scrapings.
  'assets.github.com/images/icons/emoji/', // GitHub's pre-2018 asset host; seen in archived feeds.
]

// GitHub's gemoji images, from READMEs and issues pasted into a post.
export const githubEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: hosts.map((host) => `img[src*="${host}" i]`).join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
