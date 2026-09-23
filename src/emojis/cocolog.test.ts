import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('cocologEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram', async () => {
    const value = '<p><img src="https://emojies.cocolog-nifty.com/emoticon/shine.gif"></p>'
    const expected =
      '<p><img data-emoji="" src="https://emojies.cocolog-nifty.com/emoticon/shine.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
