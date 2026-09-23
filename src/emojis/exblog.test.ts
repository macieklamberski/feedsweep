import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('exblogEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram whose alt is its filename', async () => {
    const value = html`
      <p>
        <img
          src="https://pds.exblog.jp/emoji/162.png"
          alt="162.png"
          class="emoticon-img"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://pds.exblog.jp/emoji/162.png"
          alt="162.png"
          class="emoticon-img"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
