import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

// Slack's standard emoji, pasted from a message with a shortcode alt or none. Every file is
// named by its codepoint.
export const slackEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="a.slack-edge.com/production-standard-emoji-assets/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
