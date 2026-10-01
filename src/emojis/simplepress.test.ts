import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('simplePressEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an unmapped Simple:Press smilie by its spSmiley class', async () => {
    const value = html`
      <p>
        <img
          class="spSmiley"
          alt="rip"
          src="https://example.com/wp-content/sp-resources/forum-smileys/rip_zpsec10ede9.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="spSmiley"
          alt="rip"
          src="https://example.com/wp-content/sp-resources/forum-smileys/rip_zpsec10ede9.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
