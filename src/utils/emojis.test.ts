import { describe, expect, it } from 'bun:test'
import { toMap } from 'trousse'
import { parseHtml } from '../parsers/linkedom.js'
import {
  type EmojiGlyph,
  type EmojiNameTable,
  glyphFromCodepoints,
  mergeEmojiNames,
  resolveEmojiImage,
  withEmojiPresentation,
} from './emojis.js'

const conflictingNameRegex = /happy/
const capitalNameRegex = /lower case/

describe('mergeEmojiNames', () => {
  // A filename two platforms disagree on cannot be resolved without knowing the engine, which
  // the markup does not say, so the merge refuses to pick a winner.
  it('should reject two platforms mapping one filename to different glyphs', () => {
    const conflicting = [
      { name: 'one', names: { happy: '🙂' } },
      { name: 'two', names: { happy: '😄' } },
    ]

    const throwing = () => mergeEmojiNames(conflicting)

    expect(throwing).toThrow(conflictingNameRegex)
  })

  // Lookups lower-case the filename, so an entry keyed with a capital letter would never match.
  it('should reject a name with a capital letter', () => {
    const tables = [{ name: 'one', names: { Smile: '🙂' } }]

    const throwing = () => mergeEmojiNames(tables)

    expect(throwing).toThrow(capitalNameRegex)
  })

  it('should reject a filename one platform maps to false and another to a glyph', () => {
    const conflicting: Array<EmojiNameTable> = [
      { name: 'one', names: { happy: false } },
      { name: 'two', names: { happy: '🙂' } },
    ]

    const throwing = () => mergeEmojiNames(conflicting)

    expect(throwing).toThrow(conflictingNameRegex)
  })

  it('should accept a filename both platforms map to false', () => {
    const agreeing: Array<EmojiNameTable> = [
      { name: 'one', names: { happy: false } },
      { name: 'two', names: { happy: false } },
    ]

    expect(mergeEmojiNames(agreeing)).toEqual({ happy: false })
  })

  it('should accept the same filename when the platforms agree', () => {
    const agreeing = [
      { name: 'one', names: { smile: '🙂' } },
      { name: 'two', names: { smile: '🙂' } },
    ]

    expect(mergeEmojiNames(agreeing)).toEqual({ smile: '🙂' })
  })
})

describe('glyphFromCodepoints', () => {
  const textDefaultCases: Array<[string, string]> = [
    ['263a', '☺️'],
    ['2639', '☹️'],
    ['a9', '©️'],
    ['2764', '❤️'],
  ]

  it.each(textDefaultCases)('should show the text-default codepoint %s as emoji', (stem, glyph) => {
    expect(glyphFromCodepoints(stem)).toBe(glyph)
  })

  it('should keep a codepoint that already shows as emoji as it is', () => {
    expect(glyphFromCodepoints('1f618')).toBe('😘')
  })

  it('should not add a second selector to a filename that carries one', () => {
    expect(glyphFromCodepoints('2764-fe0f')).toBe('❤️')
  })
})

describe('withEmojiPresentation', () => {
  const presentationCases: Array<[string, string]> = [
    ['❤', '❤️'],
    ['™', '™️'],
    ['1⃣', '1️⃣'],
    ['#⃣', '#️⃣'],
    ['❤️', '❤️'],
    ['1️⃣', '1️⃣'],
    ['😀', '😀'],
    ['👨‍👩‍👧', '👨‍👩‍👧'],
  ]

  it.each(presentationCases)('should turn %s into %s', (glyph, expected) => {
    expect(withEmojiPresentation(glyph)).toBe(expected)
  })
})

describe('resolveEmojiImage', () => {
  // A set that ships a name no glyph stands for keeps every picture it draws.
  const mixedNames = toMap<EmojiGlyph>({ grin: '😁', mrgreen: false })

  const getImage = (tag: string): Element => {
    return parseHtml(`<p>${tag}</p>`).querySelector('img') as Element
  }

  it('should keep a universal code alt in a mixed set as a marked picture', () => {
    const image = getImage('<img src="https://example.com/smilies/grin.gif" alt=":)">')

    expect(resolveEmojiImage(image, { isStrong: false, names: mixedNames })).toEqual({
      custom: true,
    })
  })

  it('should convert a codepoint filename in a mixed set', () => {
    const image = getImage('<img src="https://example.com/smilies/1f600.png" alt="">')

    expect(resolveEmojiImage(image, { isStrong: false, names: mixedNames })).toEqual({
      glyph: '😀',
    })
  })

  it('should convert a filename spelling its own alt in a mixed set', () => {
    const image = getImage('<img src="https://example.com/smilies/3f.png" alt="?">')

    expect(resolveEmojiImage(image, { isStrong: true, names: mixedNames })).toEqual({
      glyph: '?',
    })
  })

  it('should convert a two-digit filename spelling its own alt in a mixed set', () => {
    const image = getImage('<img src="https://example.com/smilies/ae.png" alt="®">')

    expect(resolveEmojiImage(image, { isStrong: true, names: mixedNames })).toEqual({
      glyph: '®',
    })
  })

  it('should convert a universal code alt when the set is declared not to keep pictures', () => {
    const image = getImage('<img src="https://example.com/smilies/grin.gif" alt=":)">')
    const match = { isStrong: true, names: mixedNames, keepsPictures: false }

    expect(resolveEmojiImage(image, match)).toEqual({ glyph: '🙂' })
  })

  it('should leave a weak match with an unknown name untouched', () => {
    const image = getImage('<img src="https://example.com/smilies/banner.gif" alt="">')

    expect(resolveEmojiImage(image, { isStrong: false, names: mixedNames })).toBeUndefined()
  })
})
