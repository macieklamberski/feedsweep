import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('cuteeditorEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon', async () => {
    const value =
      '<p><img src="http://www.cnitblog.com/CuteSoft_Client/CuteEditor/images/emsmilep.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="http://www.cnitblog.com/CuteSoft_Client/CuteEditor/images/emsmilep.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave another editor image untouched', async () => {
    const value =
      '<p><img src="https://example.com/CuteSoft_Client/CuteEditor/images/bold.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep an emoticon whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="http://www.cnitblog.com/CuteSoft_Client/CuteEditor/images/emsmilep.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="http://www.cnitblog.com/CuteSoft_Client/CuteEditor/images/emsmilep.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
