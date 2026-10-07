import { toMap } from 'trousse'
import type { EmojiResolverResult } from '../types.js'
import { attr } from './dom.js'
import { emojiShortcodes } from './shortcodes.js'

// A glyph, or false for a known name whose picture differs per engine, which is only marked.
export type EmojiGlyph = string | false

export type EmojiNameTable = {
  name: string
  names: Record<string, EmojiGlyph>
}

export type EmojiImageMatch = {
  // A class, host, attribute or sprite. An image matched only by its directory is left
  // untouched when it fails to resolve, so a banner in `/smilies/` is never marked.
  isStrong: boolean
  // Absent for a set whose filename is never read.
  names?: Map<string, EmojiGlyph>
  // Read by the resolver from where its set keeps the meaning, and second only to the alt.
  glyph?: EmojiGlyph
  // A file the engine paints its sprite behind, which renders nothing on its own.
  isBlank?: boolean
  // The filename as the engine's table keys it, where the engine adds a marker of its own.
  stem?: string
  // The set ships a name no glyph stands for. Implied by a `false` entry in `names`, and passed
  // by a resolver that reads its own table into `glyph` or shares one table across two sets.
  keepsPictures?: boolean
}

const emojiSequenceParts = [
  '\\p{Extended_Pictographic}', // The pictures themselves
  '\\p{Emoji_Modifier}', // Skin tones
  '\\p{Regional_Indicator}', // The pair of letters that makes a flag
  '[\\u200d\\ufe0f\\u20e3#*0-9\\s]', // Joiner, variation selector, keycap mark and its bases
  '[\\u{e0020}-\\u{e007f}]', // Tag characters, which spell out a subdivision flag
]
const emojiSequenceRegex = new RegExp(`^(?:${emojiSequenceParts.join('|')})+$`, 'u')

const emojiPictureParts = [
  '\\p{Extended_Pictographic}', // The pictures themselves
  '\\p{Regional_Indicator}', // The pair of letters that makes a flag
  '[0-9#*]\\ufe0f?\\u20e3', // A keycap: base, optional selector, enclosing mark
]
const emojiPictureRegex = new RegExp(emojiPictureParts.join('|'), 'u')

export const isEmojiShaped = (text: string): boolean => {
  return emojiSequenceRegex.test(text) && emojiPictureRegex.test(text)
}

export const getShortcode = (token: string | undefined): EmojiGlyph | undefined => {
  if (!token) {
    return
  }

  return shortcodes.get(token.toLowerCase())
}

export const glyphFromShortcode = (token: string | undefined): string | undefined => {
  const glyph = getShortcode(token)

  return glyph === false ? undefined : glyph
}

// The table for a set that names every file by its codepoint, which leaves no names to look up.
export const noEmojiNames = new Map<string, EmojiGlyph>()

// Left on an emoji image that keeps its picture, so the reader can size it like text and keep
// it out of thumbnail selection. Presence is the whole signal.
export const emojiImageAttribute = 'data-emoji'

// One name table across several engines, refusing a filename two engines draw differently,
// since nothing in the markup says which engine produced a given image.
export const mergeEmojiNames = (tables: Array<EmojiNameTable>): Record<string, EmojiGlyph> => {
  const merged: Record<string, EmojiGlyph> = {}

  for (const table of tables) {
    for (const [name, glyph] of Object.entries(table.names)) {
      // Lookups lower-case the name, so a key with a capital letter would never match.
      if (name !== name.toLowerCase()) {
        throw new Error(`Emoji name "${name}" on ${table.name} must be lower case`)
      }

      if (Object.hasOwn(merged, name) && merged[name] !== glyph) {
        throw new Error(
          `Emoji name "${name}" is ${merged[name]} and ${glyph} on different platforms`,
        )
      }

      merged[name] = glyph
    }
  }

  return merged
}

const shortcodes = toMap(mergeEmojiNames([{ name: 'shortcodes', names: emojiShortcodes }]))

// Applied to a filename in turn: the query and hash split, then the stock-file, icon-set and
// resolution markers that are not part of the name.
export const queryOrHashRegex = /[?#]/
const proxiedFileRegex = /#(https?:\/\/.+)$/
const namePrefixRegex = /^(?:default_|face-|smiley-|sf-)/
const nameVariantRegex = /@[0-9]+x$/

// A 1x1 sprite GIF data URI is under 256 bytes, and a real inlined PNG is not.
export const rendersNothing = (src: string): boolean => {
  return src.startsWith('data:') && src.length <= 256
}

export const getFileStem = (src: string): string => {
  // A Google image proxy keeps the real file after the hash, as in
  // `…=s0-d-e1-ft#https://…/1f4cc.png`.
  const proxied = src.match(proxiedFileRegex)?.[1]
  const path = (proxied ?? src).split(queryOrHashRegex)[0]
  const name = path.slice(path.lastIndexOf('/') + 1)
  const extension = name.lastIndexOf('.')

  return extension === -1 ? name : name.slice(0, extension)
}

// A filename as the name tables key it.
export const getNameStem = (src: string): string => {
  return getFileStem(src).toLowerCase().replace(namePrefixRegex, '').replace(nameVariantRegex, '')
}

// Five hex digits tops out at 0xFFFFF, so fromCodePoint never sees a value that throws.
// WoltLab names its whole default set by codepoint. Twemoji drops the leading zeros, so two digits
// are read too, only for the emoji below 0x100: © and ®, and a keycap on #, * or a digit.
const codepointNameRegex =
  /^(?:[0-9a-f]{4,5}(?:[-_][0-9a-f]{4,5})*|a[9e](?:[-_]fe0f)?|(?:2[3a]|3[0-9])(?:[-_]fe0f)?[-_]20e3)$/
const codepointSeparatorRegex = /[-_]/
const shortCodepointRegex = /^a[9e](?:[-_]fe0f)?$/
const textDefaultRegex = /^(?!\p{Emoji_Presentation})\p{Extended_Pictographic}$/u
const bareKeycapRegex = /^([0-9#*])\u20e3$/u

// A glyph as the emoji picture it stands for. A lone ☺, © or ❤ renders as a text symbol unless
// U+FE0F asks for the picture, and so does a keycap written as `1⃣` without it.
export const withEmojiPresentation = (glyph: string): string => {
  if (textDefaultRegex.test(glyph)) {
    return `${glyph}\ufe0f`
  }

  return glyph.replace(bareKeycapRegex, '$1\ufe0f\u20e3')
}

export const glyphFromCodepoints = (stem: string): string | undefined => {
  if (!codepointNameRegex.test(stem)) {
    return
  }

  const codepoints = stem.split(codepointSeparatorRegex).map((part) => Number.parseInt(part, 16))
  const glyph = String.fromCodePoint(...codepoints)

  // A hex-shaped stem like `2000` or `dead` decodes to a space or a lone surrogate.
  if (!isEmojiShaped(glyph)) {
    return
  }

  return withEmojiPresentation(glyph)
}

const bytePairRegex = /../g
const utf8Decoder = new TextDecoder('utf-8', { fatal: true })

// A filename spelling its glyph's UTF-8 bytes in hex, as VK and Telegram name theirs.
export const glyphFromUtf8Hex = (stem: string): string | undefined => {
  const pairs = stem.match(bytePairRegex) ?? []
  const bytes = Uint8Array.from(pairs, (pair) => Number.parseInt(pair, 16))

  try {
    const glyph = utf8Decoder.decode(bytes)

    if (!isEmojiShaped(glyph)) {
      return
    }

    return glyph
  } catch {}
}

const codepointTextRegex = /^[0-9a-f]{2,5}(?:[-_][0-9a-f]{2,5})*$/
const variationRegex = /️/g

// The characters a hex filename spells, emoji or not, capped at 0xFFFFF like the regex above.
const getCodepointText = (stem: string): string | undefined => {
  if (!codepointTextRegex.test(stem)) {
    return
  }

  const codepoints = stem.split(codepointSeparatorRegex).map((part) => Number.parseInt(part, 16))

  return String.fromCodePoint(...codepoints)
}

const toneModifierRegex = /[\u{1f3fb}-\u{1f3ff}]/gu
const modifierBaseRegex = /^\p{Emoji_Modifier_Base}/u
const zeroWidthJoiner = '\u200d'
const variationSelector = '\ufe0f'
// 🤝 joins the two people of `people holding hands`, and only they take a tone.
const handshake = '\u{1f91d}'

// Tones 1 to 5 are the skin tone modifiers U+1F3FB to U+1F3FF. One tone colours every person in
// the sequence, several colour them in turn, and 0 clears the tone.
export const applyTones = (glyph: string, tone: string): string => {
  const modifiers = tone.split(' ').map((value) => {
    const index = Number.parseInt(value, 10)

    return index >= 1 && index <= 5 ? String.fromCodePoint(0x1f3fa + index) : ''
  })
  const parts = glyph.replace(toneModifierRegex, '').split(zeroWidthJoiner)
  let personIndex = 0

  const tinted = parts.map((part) => {
    if (!modifierBaseRegex.test(part) || (parts.length > 1 && part === handshake)) {
      return part
    }

    const modifier = modifiers.length === 1 ? modifiers[0] : modifiers[personIndex]
    personIndex += 1

    const [base = '', ...rest] = [...part]
    const tail = rest[0] === variationSelector ? rest.slice(1) : rest

    // The selector asks for the picture form, which a modifier already implies.
    return modifier ? `${base}${modifier}${tail.join('')}` : part
  })

  return tinted.join(zeroWidthJoiner)
}

// A codepoint filename names the exact picture and a shortcode only its meaning: WoltLab binds
// `:evil:` to 1f608, which is 😈. A filename word comes last, as what survives an empty alt or a
// code each engine draws as its own face.
const getVocabularyGlyph = (
  token: string | undefined,
  src: string,
  names: Map<string, EmojiGlyph> | undefined,
  stem = getNameStem(src),
): EmojiGlyph | undefined => {
  if (!names) {
    return
  }

  // Base64 can contain `/`, so a stem taken from a data URI can match a real name by accident.
  if (src.startsWith('data:')) {
    return getShortcode(token)
  }

  // A two-digit stem is a codepoint only in a set named by codepoint. Forum packs ship `ae.gif` as
  // a Kolobok face and `a9.jpg` as a board's own art.
  const isShortStem = shortCodepointRegex.test(stem)
  const codepointGlyph = isShortStem && names.size ? undefined : glyphFromCodepoints(stem)

  if (codepointGlyph) {
    return codepointGlyph
  }

  const code = getShortcode(token)

  if (code) {
    return code
  }

  return names.get(stem) ?? code
}

const hasFalseName = (names: Map<string, EmojiGlyph> | undefined): boolean => {
  if (!names) {
    return false
  }

  for (const glyph of names.values()) {
    if (glyph === false) {
      return true
    }
  }

  return false
}

// A codepoint filename names its picture exactly, and forms a set of its own even inside a set
// that keeps its pictures. Base64 can contain `/`, and forum packs ship `ae.gif` as their own face.
const isCodepointFile = (src: string, stem: string, alt: string | undefined): boolean => {
  if (src.startsWith('data:')) {
    return false
  }

  const character = alt?.replace(variationRegex, '')

  // A filename spelling its own alt is exact at any length, Twemoji's `ae.png` for ® included.
  if (character && getCodepointText(stem) === character) {
    return true
  }

  return !shortCodepointRegex.test(stem) && glyphFromCodepoints(stem) !== undefined
}

// A set with a name no glyph stands for keeps every picture, so a post never mixes glyphs with
// the set's own drawings.
const resolveKeptPicture = (
  element: Element,
  match: EmojiImageMatch,
): EmojiResolverResult | undefined => {
  const src = element.getAttribute('src') ?? ''
  const stem = match.stem ?? getNameStem(src)
  const token = attr(element, 'data-shortname') ?? attr(element, 'alt')

  if (token && (match.isBlank || rendersNothing(src))) {
    return { text: token }
  }

  const isKnown =
    match.glyph !== undefined ||
    (match.names?.has(stem) ?? false) ||
    getShortcode(token) !== undefined

  if (match.isStrong || isKnown) {
    return { custom: true }
  }
}

// An image converts whenever one hint names its picture exactly: an emoji alt, a codepoint or
// byte filename, a universal code or a stock name, unless the set keeps its pictures.
// The title attribute is prose on every platform, never a glyph, so it is not read.
export const resolveEmojiImage = (
  element: Element,
  match: EmojiImageMatch,
): EmojiResolverResult | undefined => {
  const src = element.getAttribute('src') ?? ''
  const alt = attr(element, 'alt')
  const shortname = attr(element, 'data-shortname')

  const keepsPictures = match.keepsPictures ?? hasFalseName(match.names)
  // A set that reads no filenames numbers its files its own way, so a stem like `2694` is no
  // codepoint there.
  const isCodepointNamed =
    match.names !== undefined && isCodepointFile(src, match.stem ?? getNameStem(src), alt)

  if (keepsPictures && !isCodepointNamed) {
    return resolveKeptPicture(element, match)
  }

  // The alt is preferred over the tables, so an image matched by two resolvers resolves the
  // same either way.
  if (alt && isEmojiShaped(alt)) {
    return { glyph: alt }
  }

  if (match.glyph) {
    return { glyph: match.glyph }
  }

  const glyph = getVocabularyGlyph(shortname ?? alt, src, match.names, match.stem)

  if (glyph) {
    return { glyph }
  }

  // A filename spelling out the alt's own codepoints, like `2019.png` for ’ or `3f.png` for a `?`
  // left by broken encoding, names a character with no emoji picture.
  const character = alt?.replace(variationRegex, '')

  if (character && getCodepointText(getFileStem(src).toLowerCase()) === character) {
    return { glyph: character }
  }

  const text = shortname ?? alt

  if (text && (match.isBlank || rendersNothing(src))) {
    return { text }
  }

  // A known name recognizes the image even where the match alone is too weak to.
  if (match.isStrong || match.glyph === false || glyph === false) {
    return { custom: true }
  }
}

// An element wrapping the glyph, named by a gemoji shortcode. A sanitizer dropping unknown
// elements would take the glyph with it, so one that resolves to nothing still leaves text.
export const resolveEmojiElement = (
  element: Element,
  { glyph, shortcode }: { glyph?: EmojiGlyph; shortcode?: string },
): EmojiResolverResult | undefined => {
  const text = element.textContent ?? ''

  if (isEmojiShaped(text)) {
    return { glyph: text }
  }

  // The shortcode is the engine's own name, never a code an author typed.
  if (glyph) {
    return { glyph }
  }

  const fallback = text || shortcode

  if (fallback) {
    return { text: fallback }
  }
}
