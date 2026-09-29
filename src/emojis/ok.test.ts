import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('okEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  const hostCases: Array<string> = ['st.okcdn.ru', 'st.mycdn.me']

  it.each(hostCases)('should replace an emoji from %s by its codepoint filename', async (host) => {
    const value = `<p><img alt="" src="https://${host}/static/emoji/14-0-0/20/1f3d0@2x.png"></p>`

    expect(await transform(value)).toEqualHtml('<p>🏐</p>')
  })

  it('should leave the same path on another host untouched', async () => {
    const value =
      '<p><img alt="" src="https://example.com/static/emoji/14-0-0/20/1f3d0@2x.png"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
