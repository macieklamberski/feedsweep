import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('jforumEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a stock smilie named by its hash', async () => {
    const src = 'https://example.com/jforum/images/smilies/3b63d1616c5dfcf29f8a7a031aaa7cad.gif'
    const value = `<p><img src="${src}"></p>`
    const expected = `<p><img src="${src}" data-emoji=""></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })
})
