import type { EmojiResolver } from '../types.js'
import { getFileStem, glyphFromCodepoints, resolveEmojiImage } from '../utils/emojis.js'
import { bgImage } from '../utils/styles.js'
import { smiliesEmojiNames } from './smilies.js'

const directories = [
  '/cke_smiley/', // Froala
  '/ckeditor/plugins/smiley/new/', // CKEditor
]

// Froala's and CKEditor's emoticon images, as Japanese site builders bundle them. The folder
// mixes the CKEditor stock set, codepoint files and the builder's own pictograms like
// `item140.svg`.
export const froalaImageEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: directories.map((directory) => `img[src*="${directory}" i]`).join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames })
  },
}

// Froala's emoticon as an empty span painted with the picture as its background, which renders
// blank once the site's CSS is gone.
export const froalaElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'span[class~="fr-emoticon-img"]',
    'span[style*="ajax/libs/emojione/" i]', // The same EmojiOne files, after a CMS dropped the class
  ].join(', '),
  extract: (element) => {
    // Without the class, a span holding text is a paragraph painted by accident.
    if (!element.matches('[class~="fr-emoticon-img"]') && element.textContent?.trim()) {
      return
    }

    const url = bgImage(element)

    if (!url) {
      return
    }

    const stem = getFileStem(url).toLowerCase()
    const glyph = glyphFromCodepoints(stem) ?? smiliesEmojiNames.get(stem)

    return glyph ? { glyph } : { image: url }
  },
}
