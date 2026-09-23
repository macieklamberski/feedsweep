import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { glyphFromShortcode, resolveEmojiImage } from '../utils/emojis.js'

// Codes Bitrix boards add to the stock set, keyed in lower case. Looked up before the shared
// table, since these boards draw `=)` as a laughing face, not a plain smile.
const bitrixShortcodes = toMap({
  '=)': '😁', // Хохочу, laughing hard
  'h-)': '😎', // В очках, in sunglasses
  '8-o': '😲', // Шокирован, shocked
  ':oz:': '😵‍💫', // Головокружение, dizzy
  ':q:': '🥲', // Улыбаюсь и плачу, smiling and crying
  ':smoke:': '🚬', // Сижу курю, sitting and smoking
  '|do|': '🤣', // Умираю от смеха, dying of laughter
  '|ap|': '👏', // Аплодирую, applauding
  '|agr|': '🙂‍↕️', // Согласен, agree, drawn nodding
  '|drink|': '🍷', // In vino veritas
  '|fl|': '🚩', // С флажком, with a flag
  '|of|': '🧑‍✈️', // Офицер, officer
  '|sai|': '🧑‍✈️', // Моряк, sailor
  // :S:, Трубка: winks while smoking a pipe, and no emoji has a pipe.
})

const glyphFromCode = (code: string | undefined): string | undefined => {
  return bitrixShortcodes.get(code?.toLowerCase() ?? '') ?? glyphFromShortcode(code)
}

// Bitrix forum and blog smilies, which carry the shortcode the author typed in data-code. Their
// files are numbered or named per site, so the shortcode is the only stable key.
export const bitrixEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="bx-smile" i]',
  extract: (element) => {
    const glyph = glyphFromCode(attr(element, 'data-code')) ?? glyphFromCode(attr(element, 'alt'))

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
