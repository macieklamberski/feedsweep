import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import {
  type EmojiNameTable,
  getFileStem,
  mergeEmojiNames,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { glyphFromEmojiName } from '../utils/gemoji.js'
import { smiliesEmojiNameTables } from './smilies.js'

export const vanillaEmojiNameTable: EmojiNameTable = {
  name: 'Vanilla',
  names: {
    'simple-smile': '🙂',
    'tongue-out': '😛',
    'money-mouth': '🤑',
  },
}

// Vanilla ships the stock forum names alongside the three of its own.
const names = toMap(mergeEmojiNames([...smiliesEmojiNameTables, vanillaEmojiNameTable]))

// Vanilla's emoji. The directory is the only signal, since Vanilla's class is the generic `emoji`.
// The rest of its set is named by gemoji name, read only after the forum names, which draw
// `kiss`, `sleepy`, `smile` and `smiley` differently.
export const vanillaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/resources/emoji/" i]',
  extract: (element) => {
    const resolved = resolveEmojiImage(element, { isStrong: false, names })

    if (resolved) {
      return resolved
    }

    const glyph = glyphFromEmojiName(getFileStem(element.getAttribute('src') ?? ''))

    if (glyph) {
      return { glyph }
    }
  },
}
