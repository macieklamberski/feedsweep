import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiNameTable, mergeEmojiNames, resolveEmojiImage } from '../utils/emojis.js'
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
export const vanillaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/resources/emoji/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: false, names })
  },
}
