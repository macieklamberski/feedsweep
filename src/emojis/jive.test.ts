import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('jiveEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace the macro by a name the shortcode table carries', async () => {
    const value = html`
      <p>Thanks
        <span
          __jive_emoticon_name="wink"
          __jive_macro_name="emoticon"
          class="jive_macro jive_emote"
          src="https://example.com/4.5.4/images/emoticons/wink.gif"
        ></span>
      </p>
    `
    const expected = '<p>Thanks 😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace the macro by a gemoji name', async () => {
    const value = html`
      <p>
        <span
          __jive_emoticon_name="grin"
          __jive_macro_name="emoticon"
          class="jive_macro jive_emote"
          src="https://example.com/4.5.4/images/emoticons/grin.gif"
        ></span>
      </p>
    `
    const expected = '<p>😁</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a Jive name no table carries as fallback text', async () => {
    const value = html`
      <p>
        <span
          __jive_emoticon_name="happy"
          __jive_macro_name="emoticon"
          class="jive_macro jive_emote"
          src="https://example.com/4.5.4/images/emoticons/happy.gif"
        ></span>
      </p>
    `
    const expected = '<p><span data-emoji="">:happy:</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
