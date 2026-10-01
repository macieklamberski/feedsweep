import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('mozillaEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  const smileyCases: Array<[string, string]> = [
    ['<span class="moz-smiley-s3" title=";-)"></span>', '😉'],
    ['<span class="moz-smiley-s1"></span>', '🙂'],
    ['<span class="moz-smiley-s5" title=":-D"><span>:-D</span></span>', '😁'],
  ]

  it.each(smileyCases)('should replace %s', async (span, glyph) => {
    expect(await transform(`<p>Hi ${span}</p>`)).toEqualHtml(`<p>Hi ${glyph}</p>`)
  })

  it('should keep a code without a universal glyph as text', async () => {
    const value = '<p>Hi <span class="moz-smiley-s12" title=":-$"></span></p>'

    expect(await transform(value)).toEqualHtml('<p>Hi <span data-emoji="">:-$</span></p>')
  })

  it('should leave a span holding prose untouched', async () => {
    const value = '<p><span class="moz-smiley-s1" title=":-)">Thanks for the reply</span></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
