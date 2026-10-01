import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('smfEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a name a board added to the stock set', async () => {
    const src = 'https://example.com/Smileys/default/thumb.gif'
    const value = `<p><img src="${src}" alt=""></p>`
    const expected = `<p><img data-emoji="" src="${src}" alt=""></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })
})
