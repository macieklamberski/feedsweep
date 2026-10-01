import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('rakutenEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should move a pictogram from the old host to the current one', async () => {
    const value = '<p><img src="http://image.space.rakuten.co.jp/emoji/h734.gif" alt="!!"></p>'
    const expected =
      '<p><img src="https://plaza.jp.rakuten-static.com/img/user/emoji/h734.gif" alt="!!" data-emoji=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should move a pictogram from the current host to https', async () => {
    const value =
      '<p><img src="http://plaza.jp.rakuten-static.com/img/user/emoji/h068.gif" alt=""></p>'
    const expected =
      '<p><img src="https://plaza.jp.rakuten-static.com/img/user/emoji/h068.gif" data-emoji=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an emoji folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/emoji/h068.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
