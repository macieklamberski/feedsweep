import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('kunenaEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an unmapped Kunena smilie by its bbcode_smiley class', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/media/kunena/emoticons/y32b4.png"
          alt=":y32b4:"
          class="bbcode_smiley"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/media/kunena/emoticons/y32b4.png"
          alt=":y32b4:"
          class="bbcode_smiley"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
