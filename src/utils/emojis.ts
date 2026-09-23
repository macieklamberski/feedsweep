import { toMap } from 'trousse'
import type { EmojiResolverResult } from '../types.js'
import { attr } from './dom.js'
import vocabularies from './emojis.json' with { type: 'json' }

export type EmojiNameTable = {
  name: string
  names: Record<string, string>
}

export type EmojiImageMatch = {
  // A class, host, attribute or sprite. An image matched only by its directory is left
  // untouched when it fails to resolve, so a banner in `/smilies/` is never marked.
  isStrong: boolean
  // Absent for a set whose filename is never read.
  names?: Map<string, string>
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

const shortcodes = toMap(vocabularies.shortcodes)

// The table for a set that names every file by its codepoint, which leaves no names to look up.
export const noEmojiNames = new Map<string, string>()

// Left on an emoji image that keeps its picture, so the reader can size it like text and keep
// it out of thumbnail selection. Presence is the whole signal.
export const emojiImageAttribute = 'data-emoji'

// One name table across several engines, refusing a filename two engines draw differently,
// since nothing in the markup says which engine produced a given image.
export const mergeEmojiNames = (tables: Array<EmojiNameTable>): Record<string, string> => {
  const merged: Record<string, string> = {}

  for (const table of tables) {
    for (const [name, glyph] of Object.entries(table.names)) {
      if (merged[name] && merged[name] !== glyph) {
        throw new Error(
          `Emoji name "${name}" is ${merged[name]} and ${glyph} on different platforms`,
        )
      }

      merged[name] = glyph
    }
  }

  return merged
}

// Applied to a filename in turn: the query and hash split, then the stock-file, icon-set and
// resolution markers that are not part of the name.
const queryOrHashRegex = /[?#]/
const namePrefixRegex = /^(?:default_|face-|smiley-|sf-)/
const nameVariantRegex = /@[0-9]+x$/

// A 1x1 sprite GIF data URI is under 256 bytes, and a real inlined PNG is not.
export const rendersNothing = (src: string): boolean => {
  return src.startsWith('data:') && src.length <= 256
}

const getFileStem = (src: string): string => {
  const path = src.split(queryOrHashRegex)[0]
  const name = path.slice(path.lastIndexOf('/') + 1)
  const extension = name.lastIndexOf('.')

  return extension === -1 ? name : name.slice(0, extension)
}

// Five hex digits tops out at 0xFFFFF, so fromCodePoint never sees a value that throws.
// WoltLab names its whole default set by codepoint.
const codepointNameRegex = /^[0-9a-f]{4,5}(?:[-_][0-9a-f]{4,5})*$/
const codepointSeparatorRegex = /[-_]/

const glyphFromCodepoints = (stem: string): string | undefined => {
  if (!codepointNameRegex.test(stem)) {
    return
  }

  const codepoints = stem.split(codepointSeparatorRegex).map((part) => Number.parseInt(part, 16))
  const glyph = String.fromCodePoint(...codepoints)

  // A hex-shaped stem like `2000` or `dead` decodes to a space or a lone surrogate.
  return isEmojiShaped(glyph) ? glyph : undefined
}

// The filename is the second key because it is what survives an empty alt.
const glyphFromVocabularies = (
  token: string | undefined,
  src: string,
  names: Map<string, string>,
): string | undefined => {
  const byShortcode = token ? shortcodes.get(token.toLowerCase()) : undefined

  if (byShortcode) {
    return byShortcode
  }

  // Base64 can contain `/`, so a stem taken from a data URI can match a real name by accident.
  if (src.startsWith('data:')) {
    return
  }

  const stem = getFileStem(src)
    .toLowerCase()
    .replace(namePrefixRegex, '')
    .replace(nameVariantRegex, '')

  return names.get(stem) ?? glyphFromCodepoints(stem)
}

// The title attribute is prose on every platform, never a glyph, so it is not read.
// XenForo's is `Big grin    :D`, phpBB's the English `Smile`, Khoros' localized.
export const resolveEmojiImage = (
  element: Element,
  match: EmojiImageMatch,
): EmojiResolverResult | undefined => {
  const src = element.getAttribute('src') ?? ''
  const alt = attr(element, 'alt')
  const shortname = attr(element, 'data-shortname')

  // The alt is preferred over the tables, so an image matched by two resolvers resolves the
  // same either way.
  if (alt && isEmojiShaped(alt)) {
    return { glyph: alt }
  }

  const glyph = match.names ? glyphFromVocabularies(shortname ?? alt, src, match.names) : undefined

  if (glyph) {
    return { glyph }
  }

  const text = rendersNothing(src) ? (shortname ?? alt) : undefined

  if (text) {
    return { text }
  }

  if (match.isStrong) {
    return { custom: true }
  }
}
