import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('drupalEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an unmapped Drupal smilie by its smiley-content class', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/modules/smileys/packs/Roving/flat.png"
          alt="Stare"
          class="smiley-content"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/modules/smileys/packs/Roving/flat.png"
          alt="Stare"
          class="smiley-content"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
