import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('easydiscussEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an EasyDiscuss smilie by its bb-smiley class', async () => {
    const value = html`
      <p>
        <img
          alt=":)"
          class="bb-smiley"
          src="https://example.com/media/com_easydiscuss/images/markitup/emoticon-smile.png"
        >
      </p>
    `
    const expected = '<p>🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
