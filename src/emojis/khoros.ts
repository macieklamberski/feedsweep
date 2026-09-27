import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  type EmojiGlyph,
  type EmojiNameTable,
  getFileStem,
  getNameStem,
  glyphFromCodepoints,
  mergeEmojiNames,
  resolveEmojiElement,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'
import { smilieSelector, smiliesEmojiNames, smiliesEmojiNameTables } from './smilies.js'

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
    const glyph = glyphFromGemojiName(title) ?? glyphFromGemojiName(id)
    let shortcode = title

    if (!shortcode && id) {
      shortcode = `:${id}:`
    }

    return resolveEmojiElement(element, { glyph, shortcode })
  },
}

const markerSelector = [
  'img[class~="lia-image-emoji" i]',
  // As in `emoticon emoticon-smileywink`. Case-sensitive, since Windows Live Writer's
  // `wlEmoticon-smile` has no name table.
  'img[class*="emoticon-"]',
].join(', ')

// Khoros files its stock faces with a size prefix, as in `16x16_smiley-happy.png`, which
// Vodafone's copy of the set writes as `15x15_`.
const sizePrefixRegex = /^1[56]x1[56]_/

// Keyed without the size prefix.
const khorosEmojiNameTable: EmojiNameTable = {
  name: 'Khoros and Lithium',
  names: {
    'smiley-happy': '🙂',
    'smiley-wink': '😉',
    'smiley-very-happy': '😁',
    'smiley-tongue': '😛',
    'smiley-sad': '🙁',
    'smiley-mad': '😠',
    'smiley-surprised': '😲',
    'smiley-lol': '🤣',
    'smiley-embarrassed': '😳',
    'smiley-indifferent': '😐',
    heart: '❤️',
    'cat-happy': '😺',
    'cat-very-happy': '😸',
    'cat-lol': '😹',
    'smiley-frustrated': false,
    // Unicode's cat faces stop at the three smiles above.
    'cat-wink': false,
    'cat-tongue': false,
    'cat-embarrassed': false,
    // _woman-*, _man-*, _robot-*: no such faces at all.
  },
}
const names = toMap(mergeEmojiNames([...smiliesEmojiNameTables, khorosEmojiNameTable]))

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

// Khoros' emoji images: the stock faces its classes or its names mark, and Samsung's set named by
// codepoint, under any smilie directory.
export const khorosImageEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, ${smilieSelector}`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const nameStem = getNameStem(src)
    const stem = nameStem.replace(sizePrefixRegex, '')
    const glyph = getNumberedGlyph(src)
    // A face only Khoros names, or one behind its size prefix, which no other resolver reads.
    const isKhorosName =
      Object.hasOwn(khorosEmojiNameTable.names, stem) &&
      (stem !== nameStem || !smiliesEmojiNames.has(stem))

    if (!element.matches(markerSelector) && glyph === undefined && !isKhorosName) {
      return
    }

    return resolveEmojiImage(element, { isStrong: true, names, glyph, stem })
  },
}
