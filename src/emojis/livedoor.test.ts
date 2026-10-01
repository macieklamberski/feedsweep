import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('livedoorEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram from the parts host', async () => {
    const value = '<p><img src="https://parts.blog.livedoor.jp/img/emoji/3/ic_f_clover.png"></p>'
    const expected =
      '<p><img data-emoji="" src="https://parts.blog.livedoor.jp/img/emoji/3/ic_f_clover.png"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram from the blogimg host', async () => {
    const value = '<p><img alt="" src="https://common.blogimg.jp/emoji/137414.gif"></p>'
    const expected =
      '<p><img data-emoji="" alt="" src="https://common.blogimg.jp/emoji/137414.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
