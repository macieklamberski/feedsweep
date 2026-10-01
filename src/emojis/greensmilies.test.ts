import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('greensmiliesEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a hotlinked smilie', async () => {
    const value =
      '<p><img src="http://www.greensmilies.com/smile/smiley_emoticons_fips_hurra2.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="http://www.greensmilies.com/smile/smiley_emoticons_fips_hurra2.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a smile folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/smile/smiley.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
