import { describe, expect, it } from 'bun:test'
import { glyphFromGemojiName } from './gemoji.js'

describe('glyphFromGemojiName', () => {
  it('should return the glyph for a gemoji name', () => {
    expect(glyphFromGemojiName('tophat')).toBe('🎩')
  })

  it('should return the glyph for a CLDR name', () => {
    expect(glyphFromGemojiName('red_heart')).toBe('❤️')
  })

  it('should read a name wrapped in colons', () => {
    expect(glyphFromGemojiName(':slightly_smiling_face:')).toBe('🙂')
  })

  it('should prefer a gemoji name to the CLDR name of another glyph', () => {
    expect(glyphFromGemojiName('kiss')).toBe('💋')
  })

  it('should return undefined for a CLDR name two glyphs share', () => {
    expect(glyphFromGemojiName('keycap')).toBeUndefined()
  })
})
