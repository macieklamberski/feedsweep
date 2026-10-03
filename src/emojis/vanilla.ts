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

// The EmojiExtender plugin's directory holds nothing but emoji sets, its stock ones and a forum's
// own, so it is a strong match where the core directory is not.
// See: https://github.com/prosembler/vanilla/tree/cda42cea6b62cdc80667846f8e2a76fe8775a6d4/plugins/emojiextender/emoji.
const extenderRegex = /\/plugins\/emojiextender\/emoji\//i

// Vanilla's emoji, in the core directory and in the EmojiExtender sets. The directory is the only
// signal, since Vanilla's class is the generic `emoji`. Vanilla names its files by gemoji name,
// which is exact even where a forum engine draws a file of the same name as its own face, so the
// forum names only cover what gemoji does not know.
export const vanillaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="/resources/emoji/" i], img[src*="/plugins/emojiextender/emoji/" i]',
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const glyph = glyphFromGemojiName(getFileStem(src))
    const isStrong = extenderRegex.test(src)

    return resolveEmojiImage(element, { isStrong, names, glyph })
  },
}
