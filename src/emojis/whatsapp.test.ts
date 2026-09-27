import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('whatsappEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  const stemCases: Array<[string, string]> = [
    ['002796', '➖'],
    ['0025aa_00fe0f', '▪️'],
    ['01f600', '😀'],
  ]

  it.each(stemCases)('should replace a span painted with %s', async (stem, glyph) => {
    const value = `<p>Hi <span style="background-image: url(&quot;https://web.whatsapp.com/emoji/v1/15/1/2/single/w/40/${stem}.png&quot;)"></span></p>`

    expect(await transform(value)).toEqualHtml(`<p>Hi ${glyph}</p>`)
  })

  it('should leave a painted span holding prose untouched', async () => {
    const value =
      '<p><span style="background-image: url(https://web.whatsapp.com/emoji/v1/15/1/2/single/w/40/01f600.png)">Hello</span></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
