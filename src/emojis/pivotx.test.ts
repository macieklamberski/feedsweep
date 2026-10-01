import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('pivotxEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon from the Trillian set', async () => {
    const value =
      '<p><img src="http://example.com/pivotx/includes/emoticons/trillian/e_02.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="http://example.com/pivotx/includes/emoticons/trillian/e_02.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave another PivotX image untouched', async () => {
    const value = '<p><img src="https://example.com/pivotx/includes/icons/e_02.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
