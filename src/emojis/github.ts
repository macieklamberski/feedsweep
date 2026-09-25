import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  getFileStem,
  glyphFromCodepoints,
  noEmojiNames,
  resolveEmojiElement,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { glyphFromEmojiName } from '../utils/gemoji.js'

const hosts = [
  'githubassets.com/images/icons/emoji/', // GitHub README scrapings.
  'assets.github.com/images/icons/emoji/', // GitHub's pre-2018 asset host; seen in archived feeds.
  'assets-cdn.github.com/images/icons/emoji/', // GitHub's asset CDN before githubassets.com.
]

// GitHub's gemoji images, from READMEs and issues pasted into a post.
export const githubImageEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: hosts.map((host) => `img[src*="${host}" i]`).join(', '),
  extract: (element) => {
    const resolved = resolveEmojiImage(element, { isStrong: false, names: noEmojiNames })

    if (resolved) {
      return resolved
    }

    // A file outside `unicode/` is named by its gemoji name, like `arrow_up.png`.
    const glyph = glyphFromEmojiName(getFileStem(element.getAttribute('src') ?? ''))

    return glyph ? { glyph } : { custom: true }
  },
}

const toneModifierRegex = /[\u{1f3fb}-\u{1f3ff}]/gu
const modifierBaseRegex = /^\p{Emoji_Modifier_Base}/u
const zeroWidthJoiner = '\u200d'
const variationSelector = '\ufe0f'

// Tones 1 to 5 are the skin tone modifiers U+1F3FB to U+1F3FF. One tone colours every person in
// the sequence, several colour them in turn, and 0 clears the tone.
const applyTones = (glyph: string, tone: string): string => {
  const modifiers = tone.split(' ').map((value) => {
    const index = Number.parseInt(value, 10)

    return index >= 1 && index <= 5 ? String.fromCodePoint(0x1f3fa + index) : ''
  })
  const parts = glyph.replace(toneModifierRegex, '').split(zeroWidthJoiner)
  let personIndex = 0

  const tinted = parts.map((part) => {
    if (!modifierBaseRegex.test(part)) {
      return part
    }

    const modifier = modifiers.length === 1 ? modifiers[0] : modifiers[personIndex]
    personIndex += 1

    const [base = '', ...rest] = [...part]
    const tail = rest[0] === variationSelector ? rest.slice(1) : rest

    // The selector asks for the picture form, which a modifier already implies.
    return modifier ? base + modifier + tail.join('') : part
  })

  return tinted.join(zeroWidthJoiner)
}

// GitHub's emoji element from rendered markdown, holding the glyph with its gemoji name in alias.
// Some feeds garble or drop the glyph, and fallback-src still names its codepoint. The skin tone
// sits in `tone`, which the element applies to the glyph in the browser.
export const githubElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'g-emoji',
  extract: (element) => {
    const fallbackSrc = attr(element, 'fallback-src')
    const glyph = fallbackSrc ? glyphFromCodepoints(getFileStem(fallbackSrc)) : undefined
    const alias = attr(element, 'alias')
    const tone = attr(element, 'tone')
    const shortcode = alias ? `:${alias}:` : undefined
    const result = resolveEmojiElement(element, {
      glyph: glyph ?? glyphFromEmojiName(alias),
      shortcode,
    })

    if (!tone || !result || !('glyph' in result)) {
      return result
    }

    return { glyph: applyTones(result.glyph, tone) }
  },
}
