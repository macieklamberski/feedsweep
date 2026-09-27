import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  type EmojiGlyph,
  getFileStem,
  glyphFromCodepoints,
  resolveEmojiElement,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { glyphFromEmojiName } from '../utils/gemoji.js'
import { smilieSelector, smiliesEmojiNames } from './smilies.js'

const idPrefixRegex = /^lia_/
const hyphenRegex = /-/g

// Khoros' emoji element, empty and named by CLDR short name twice: snake case in the title,
// which some communities localize, and hyphenated in an id that stays English.
export const khorosEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'li-emoji',
  extract: (element) => {
    const title = attr(element, 'title')
    const id = attr(element, 'id')?.replace(idPrefixRegex, '').replace(hyphenRegex, '_')
    const glyph = glyphFromEmojiName(title) ?? glyphFromEmojiName(id)

    return resolveEmojiElement(element, { glyph, shortcode: title ?? (id ? `:${id}:` : undefined) })
  },
}

const markerSelector = [
  'img[class~="lia-image-emoji" i]',
  // As in `emoticon emoticon-smileywink`. Case-sensitive, since Windows Live Writer's
  // `wlEmoticon-smile` has no name table.
  'img[class*="emoticon-"]',
].join(', ')

// Samsung's Khoros set files each face as `<n>.<name>_<codepoints>`, as in `2.winking-face_1f609`,
// and a skin tone appends the modifier's name and codepoint after the full sequence.
const numberedNameRegex = /^[0-9]+\.([a-z-]+)_/

const getNumberedGlyph = (src: string): EmojiGlyph | undefined => {
  const stem = getFileStem(src).toLowerCase()
  const name = stem.match(numberedNameRegex)?.[1]

  if (!name) {
    return
  }

  // Samsung's own smiling face is filed under the codepoint of 🃏.
  if (name === 'samsung') {
    return false
  }

  for (const part of stem.split('_')) {
    const glyph = glyphFromCodepoints(part)

    if (glyph) {
      return glyph
    }
  }
}

// Khoros' emoji images: the stock faces its classes mark, and Samsung's set named by codepoint
// under any smilie directory.
export const khorosImageEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, ${smilieSelector}`,
  extract: (element) => {
    const glyph = getNumberedGlyph(element.getAttribute('src') ?? '')

    if (!element.matches(markerSelector) && glyph === undefined) {
      return
    }

    return resolveEmojiImage(element, { isStrong: true, names: smiliesEmojiNames, glyph })
  },
}
