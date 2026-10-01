import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { glyphFromShortcode, resolveEmojiElement } from '../utils/emojis.js'

// The code Thunderbird and SeaMonkey's composer writes for each numbered smiley class.
const smileyCodes: Record<string, string> = {
  s1: ':-)',
  s2: ':-(',
  s3: ';-)',
  s4: ':-P',
  s5: ':-D',
  s6: ':-[',
  s7: ':-\\',
  s8: '=-O',
  s9: ':-*',
  s10: '>:o',
  s11: '8-)',
  s12: ':-$',
  s13: ':-!',
  s14: 'O:-)',
  s15: ":'(",
  s16: ':-X',
}

const classRegex = /(?:^|\s)moz-smiley-(s\d+)(?:\s|$)/

// A smiley from Mozilla's mail composer, an empty span its own stylesheet paints, with the typed
// code in the title.
export const mozillaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[class*="moz-smiley-s" i]',
  extract: (element) => {
    const code = smileyCodes[attr(element, 'class')?.match(classRegex)?.[1] ?? '']
    const title = attr(element, 'title')
    const text = element.textContent?.trim()

    // Some copies keep the code as the span's text, which is fine to replace, and never prose.
    if (text && text !== title && text !== code) {
      return
    }

    const glyph = glyphFromShortcode(title) ?? glyphFromShortcode(code)

    return resolveEmojiElement(element, { glyph, shortcode: title ?? code })
  },
}
