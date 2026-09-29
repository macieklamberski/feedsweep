import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('lexicalEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an empty node by its glyph', async () => {
    const value = '<p>Hi <span class="emoji" data-lexical-emoji="▪️"></span></p>'

    expect(await transform(value)).toEqualHtml('<p>Hi ▪️</p>')
  })

  it('should leave a node whose glyph broke untouched', async () => {
    const value = '<p>Hi <span data-lexical-emoji="?"></span></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
