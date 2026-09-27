import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('rakutenEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram from the old host', async () => {
    const value = '<p><img src="http://image.space.rakuten.co.jp/emoji/h068.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="http://image.space.rakuten.co.jp/emoji/h068.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram from the current host', async () => {
    const value =
      '<p><img src="https://plaza.jp.rakuten-static.com/img/user/emoji/h068.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://plaza.jp.rakuten-static.com/img/user/emoji/h068.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an emoji folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/emoji/h068.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
