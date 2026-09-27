import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('yahooJapanEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('Mail emoji', () => {
    const codepointCases: Array<[string, string]> = [
      ['https://s.yimg.jp/images/mail/emoji/ymobile/1F345.png', '🍅'],
      ['https://s.yimg.jp/images/mail/emoji/ymobile/2665.png', '♥️'],
      ['https://s.yimg.jp/images/mail/emoji/ymobile1/1F60B.png', '😋'],
      ['https://s.yimg.jp/images/mail/emoji/ymobile2/26AB.png', '⚫'],
      ['https://s.yimg.jp/images/mail/emoji/docomo_au/1F603.png', '😃'],
      ['https://i.yimg.jp/images/mail/emoji/docomo_au/2728.png', '✨'],
    ]

    it.each(codepointCases)('should replace %s by its codepoint', async (src, glyph) => {
      const value = html`
        <p>
          <img
            alt="絵文字"
            src="${src}"
          >
        </p>
      `
      const expected = `<p>${glyph}</p>`

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an emoji named by its carrier code', async () => {
      const value = '<p><img src="https://i.yimg.jp/images/mail/emoji/15/ew_icon_a257.gif"></p>'
      const expected =
        '<p><img src="https://i.yimg.jp/images/mail/emoji/15/ew_icon_a257.gif" data-emoji=""></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave the emoji path on a host outside Yahoo untouched', async () => {
      const value = '<p><img src="https://example.com/images/mail/emoji/15/ew_icon_a257.gif"></p>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should mark a Messenger emoticon on the Japanese host', async () => {
    const value = html`
      <p>
        <img
          alt="*;) winking"
          src="https://i.yimg.jp/i/jp/mesg/emoticons6/21.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="*;) winking"
          src="https://i.yimg.jp/i/jp/mesg/emoticons6/21.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
