import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  getFileStem,
  glyphFromCodepoints,
  isEmojiShaped,
  resolveEmojiImage,
} from '../utils/emojis.js'

const codepointClassRegex = /(?:^|\s)emoji([0-9a-f]+(?:-[0-9a-f]+)*)(?:\s|$)/i

// An emoji pasted from a picker as an image with no src, holding its character in data-c and
// its codepoints in a class like `emoji1f64b`.
export const genericCharacterEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="emoji" i][data-c], span[class~="emoji" i]',
  extract: (element) => {
    const isSpan = element.tagName.toLowerCase() === 'span'

    // A span holding its glyph as text needs nothing, and an image with a src is a picture.
    if (isSpan ? element.textContent?.trim() : attr(element, 'src')) {
      return
    }

    const character = attr(element, 'data-c')

    if (character && isEmojiShaped(character)) {
      return { glyph: character }
    }

    const codepoints = attr(element, 'class')?.match(codepointClassRegex)?.[1]
    const glyph = codepoints ? glyphFromCodepoints(codepoints.toLowerCase()) : undefined

    // An empty span with nothing to read is left for other passes.
    if (isSpan) {
      return glyph ? { glyph } : undefined
    }

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}

// The class Vanilla, NodeBB, newer WordPress and Discourse's custom uploads share. It is read for a
// glyph alt or a codepoint filename and never for a shortcode, since each engine names its own.
export const genericEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="emoji" i]',
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = glyphFromCodepoints(getFileStem(src).toLowerCase())

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
