import type { EmojiResolver } from '../types.js'
import { getFileStem, glyphFromCodepoints, resolveEmojiImage } from '../utils/emojis.js'
import { bgImage } from '../utils/styles.js'
import { smiliesEmojiNames } from './smilies.js'

// Froala's emoticon images, as Japanese site builders bundle them. The folder mixes the
// CKEditor stock set, codepoint files and the builder's own pictograms like `item140.svg`.
export const froalaImageEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/cke_smiley/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames })
  },
}

// Froala's emoticon as an empty span painted with the picture as its background, which renders
// blank once the site's CSS is gone.
export const froalaElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[class~="fr-emoticon-img"]',
  extract: (element) => {
    const url = bgImage(element)

    if (!url) {
      return
    }

    const stem = getFileStem(url).toLowerCase()
    const glyph = glyphFromCodepoints(stem) ?? smiliesEmojiNames.get(stem)

    return glyph ? { glyph } : { image: url }
  },
}
