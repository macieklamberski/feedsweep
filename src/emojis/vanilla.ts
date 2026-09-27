import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import {
  type EmojiNameTable,
  getFileStem,
  mergeEmojiNames,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'
import { smiliesEmojiNameTables } from './smilies.js'

const vanillaEmojiNameTable: EmojiNameTable = {
  name: 'Vanilla',
  names: {
    'simple-smile': '🙂',
  },
}

// Vanilla ships the stock forum names alongside its own.
const names = toMap(mergeEmojiNames([...smiliesEmojiNameTables, vanillaEmojiNameTable]))

// Vanilla's emoji. The directory is the only signal, since Vanilla's class is the generic `emoji`.
// Vanilla names its files by gemoji name, which is exact even where a forum engine draws a file of
// the same name as its own face, so the forum names only cover what gemoji does not know.
export const vanillaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/resources/emoji/" i]',
  extract: (element) => {
    const glyph = glyphFromGemojiName(getFileStem(element.getAttribute('src') ?? ''))

    return resolveEmojiImage(element, { isStrong: false, names, glyph })
  },
}
