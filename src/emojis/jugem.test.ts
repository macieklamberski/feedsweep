import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('jugemEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram with no class or alt', async () => {
    const value = '<p><img src="https://picto0.jugem.jp/emoji/j_082.gif"></p>'
    const expected = '<p><img data-emoji="" src="https://picto0.jugem.jp/emoji/j_082.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
