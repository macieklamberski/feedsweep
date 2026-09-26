import { describe, expect, it } from 'bun:test'
import { glyphFromCodepoints, mergeEmojiNames } from './emojis.js'
import vocabularies from './emojis.json' with { type: 'json' }

const asciiLetterRegex = /[a-zA-Z]/
const conflictingNameRegex = /happy/

describe('shortcode table', () => {
  const shortcodeEntries = Object.entries(vocabularies.shortcodes)

  // Iterates the real table, so every entry is exercised and a new entry is covered
  // automatically. A value carrying ASCII letters would inject a word into the document,
  // and an empty one would strand the wrapper it sat in for stripEmptyTags to delete.
  it.each(shortcodeEntries)('should map %s to a bare glyph', (_shortcode, glyph) => {
    expect(glyph).not.toBe('')
    expect(glyph).not.toMatch(asciiLetterRegex)
  })

  it('should key every entry in lower case so lookups can normalize', () => {
    const keys = Object.keys(vocabularies.shortcodes)

    expect(keys).toEqual(keys.map((key) => key.toLowerCase()))
  })
})

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
