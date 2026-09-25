import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('cocologEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram', async () => {
    const value = '<p><img src="https://emojies.cocolog-nifty.com/emoticon/shine.gif"></p>'
    const expected =
      '<p><img data-emoji="" src="https://emojies.cocolog-nifty.com/emoticon/shine.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a TypePad pictogram from another host', async () => {
    const value = html`
      <p>
        <img
          class="emoticon shine"
          src="https://static.example.com/.shared/images/emoticon/shine.gif"
          alt="shine"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="emoticon shine"
          src="https://static.example.com/.shared/images/emoticon/shine.gif"
          alt="shine"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
