import { describe, expect, it } from 'bun:test'
import { mergeEmojiNames } from './emojis.js'
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
