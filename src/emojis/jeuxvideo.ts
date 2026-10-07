import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// jeuxvideo.com's forum smileys, numbered, with the site's own codes like  in the alt.
export const jeuxvideoEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="image.jeuxvideo.com/smileys_img/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
