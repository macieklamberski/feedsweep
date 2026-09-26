import { describe, expect, it } from 'bun:test'
import { glyphFromEmojiName } from './gemoji.js'

describe('glyphFromEmojiName', () => {
  it('should return the glyph for a gemoji name', () => {
    expect(glyphFromEmojiName('tophat')).toBe('🎩')
  })

  it('should return the glyph for a CLDR name', () => {
    expect(glyphFromEmojiName('red_heart')).toBe('❤️')
  })

  it('should read a name wrapped in colons', () => {
    expect(glyphFromEmojiName(':slightly_smiling_face:')).toBe('🙂')
  })

  it('should prefer the shortcode table to gemoji', () => {
    expect(glyphFromEmojiName('cool')).toBe('😎')
  })

  it('should prefer a gemoji name to the CLDR name of another glyph', () => {
    expect(glyphFromEmojiName('kiss')).toBe('💋')
  })

  it('should return undefined for a CLDR name two glyphs share', () => {
    expect(glyphFromEmojiName('keycap')).toBeUndefined()
  })
})
