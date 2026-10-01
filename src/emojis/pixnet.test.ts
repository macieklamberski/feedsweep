import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('pixnetEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a numbered emoticon', async () => {
    const value =
      '<p><img src="https://s.pixfs.net/f.pixnet.net/images/emotions/032.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://s.pixfs.net/f.pixnet.net/images/emotions/032.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a named emoticon', async () => {
    const value =
      '<p><img src="https://s.pixfs.net/f.pixnet.net/images/emotions/regular_smile.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://s.pixfs.net/f.pixnet.net/images/emotions/regular_smile.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an emotions folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/images/emotions/032.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
