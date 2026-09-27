import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { type EmojiGlyph, getShortcode, resolveEmojiImage } from '../utils/emojis.js'

// Codes FLOT.com and FlotProm.ru add to their Bitrix sets, keyed in lower case.
const bitrixShortcodes = toMap<EmojiGlyph>({
  'h-)': false, // В очках, in sunglasses
  '8-o': false, // Шокирован, shocked
  ':oz:': false, // Головокружение, dizzy
  ':q:': false, // Улыбаюсь и плачу, smiling and crying
  ':l:': false, // Виноват, my bad
  ':smoke:': false, // Сижу курю, sitting and smoking, from hi-fi.ru's set
  '|do|': false, // Умираю от смеха, dying of laughter
  '|ap|': false, // Аплодирую, applauding
  '|agr|': false, // Согласен, agree, drawn nodding
  '|drink|': false, // In vino veritas
  '|fl|': false, // С флажком, with a flag
  '|of|': false, // Офицер, officer
  '|sai|': false, // Моряк, sailor
  '=t': false, // Показываю язык, sticking out tongue
  ':/:': false, // Нахмурен, frowning
  '|ax|': false, // Цветок, a flower, drawn as a rose
  '|hea|': false, // Сердце, heart
  '|te|': false, // Лучше молчать, better to keep quiet
  '|und3|': false, // Подводник 3, submariner in a diving helmet
  '|he|': false, // SOS
  ':facepalm:': false,
  ':{}': false,
  ':-{}': false,
  ':~(': false,
  ':-/': false,
  ':s:': false, // Трубка, winks while smoking a pipe
})

const getCode = (code: string | undefined): EmojiGlyph | undefined => {
  return bitrixShortcodes.get(code?.toLowerCase() ?? '') ?? getShortcode(code)
}

// The code in data-code or the alt, whichever has a glyph.
const getGlyph = (codes: Array<string | undefined>): EmojiGlyph | undefined => {
  let known: EmojiGlyph | undefined

  for (const code of codes) {
    const glyph = getCode(code)

    if (glyph) {
      return glyph
    }

    if (glyph === false) {
      known = false
    }
  }

  return known
}

// Bitrix forum and blog smilies, which carry the shortcode the author typed in data-code. Their
// files are numbered or named per site, so the shortcode is the only stable key.
export const bitrixEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="bx-smile" i]',
  extract: (element) => {
    const glyph = getGlyph([attr(element, 'data-code'), attr(element, 'alt')])

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
