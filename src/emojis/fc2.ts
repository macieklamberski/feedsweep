import { parseUrl } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'
import { placeholderBaseUrl } from '../utils/urls.js'

const classSelector = 'img[class~="emoji" i][src*=".fc2.com/" i]'

// FC2's own image hosts. A homepage on `<user>.web.fc2.com` names its own `/image/` folders.
const pictogramHostRegex = /^(?:static|blog\d*|blog-imgs-\d+(?:-origin)?)\.fc2\.com$/i

// FC2's pictograms under the shared emoji class, numbered in decimal per carrier: `e` is au's icon
// number and `i` docomo's, and each holds ids with no Unicode counterpart. So `2640.gif` is not
// U+2640.
export const fc2EmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    classSelector,
    // The same pictograms pasted without the class, from FC2's own folders. A user's uploads sit
    // under a one-letter folder path, `/a/b/c/user/`, that none of these match.
    'img[src*=".fc2.com/emoji/" i]', // The dated library and the carrier sets
    'img[src*=".fc2.com/image/emoji/" i]',
    'img[src*=".fc2.com/image/icon/" i]',
    'img[src*=".fc2.com/image/e/" i]',
    'img[src*=".fc2.com/image/i/" i]',
    'img[src*=".fc2.com/image/v/" i]',
  ].join(', '),
  extract: (element) => {
    const host = parseUrl(element.getAttribute('src') ?? '', placeholderBaseUrl)?.hostname ?? ''

    if (!element.matches(classSelector) && !pictogramHostRegex.test(host)) {
      return
    }

    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
