import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('fudforumEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace a smilie from the smiley_icons directory', async () => {
    const value = html`
      <p>
        <img
          src="http://example.com/forum/images/smiley_icons/icon_wink.gif"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml('<p>😉</p>')
  })
})
