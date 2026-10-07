import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('fc2EmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram whose number reads as a codepoint', async () => {
    const value = html`
      <p>
        <img
          src="//blog-imgs-1.fc2.com/emoji/2007-02-05/2640.gif"
          alt=""
          border="0"
          class="emoji"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="//blog-imgs-1.fc2.com/emoji/2007-02-05/2640.gif"
          alt=""
          border="0"
          class="emoji"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a pictogram whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="//blog-imgs-1.fc2.com/image/e/6.gif"
          alt="😀"
          class="emoji"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="//blog-imgs-1.fc2.com/image/e/6.gif"
          alt="😀"
          class="emoji"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
