import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('monalisaEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an unmapped WP Monalisa smilie by its wpml_ico class', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/wp-content/plugins/wp-monalisa/icons/smiley_emoticons_nicken.gif"
          alt=":ja:"
          class="wpml_ico"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/wp-content/plugins/wp-monalisa/icons/smiley_emoticons_nicken.gif"
          alt=":ja:"
          class="wpml_ico"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
