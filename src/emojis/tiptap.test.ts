import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('tiptapEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an empty node by its data-emoji glyph', async () => {
    const value = '<p>Hi <span data-type="emoji" data-emoji="🥽" data-name="goggles"></span></p>'

    expect(await transform(value)).toEqualHtml('<p>Hi 🥽</p>')
  })

  it('should replace an empty node by its gemoji name', async () => {
    const value = '<p>Hi <span data-name="goggles" data-type="emoji"></span></p>'

    expect(await transform(value)).toEqualHtml('<p>Hi 🥽</p>')
  })

  it('should keep a name gemoji does not know as text', async () => {
    const value = '<p>Hi <span data-name="party_parrot" data-type="emoji"></span></p>'

    expect(await transform(value)).toEqualHtml(
      '<p>Hi <span data-emoji="">:party_parrot:</span></p>',
    )
  })
})
