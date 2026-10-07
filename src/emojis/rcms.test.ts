import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('rcmsEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a numbered pictogram', async () => {
    const value =
      '<p><img src="https://example.com/images/modules/mobile/emoji2/148.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://example.com/images/modules/mobile/emoji2/148.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave another mobile module image untouched', async () => {
    const value = '<p><img src="https://example.com/images/modules/mobile/banner.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep a pictogram whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/images/modules/mobile/emoji2/148.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/images/modules/mobile/emoji2/148.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
