import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('shinobiEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a numbered pictogram', async () => {
    const value =
      '<p><img src="https://happycase2.blog.shinobi.jp/emoji/icon/E/537.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://happycase2.blog.shinobi.jp/emoji/icon/E/537.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave the same path on another host untouched', async () => {
    const value = '<p><img src="https://example.com/emoji/icon/E/537.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
