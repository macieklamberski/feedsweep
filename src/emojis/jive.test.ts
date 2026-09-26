import { describe, expect, it } from 'bun:test'
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

  describe('rendered emoticon span', () => {
    it('should replace the span by the name in its class', async () => {
      const value = html`
        <p>It is missing
          <span
            aria-label="Sad"
            class="emoticon_sad emoticon-inline"
            style="height:16px;width:16px;"
          ></span>
        </p>
      `
      const expected = '<p>It is missing 🙁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // The Facebook classic resolver also selects an `emoticon_<name>` span, and would leave the
    // bare name as text.
    it('should mark a name no table carries as fallback text', async () => {
      const value = '<p><span class="emoticon-inline emoticon_happy"></span></p>'
      const expected = '<p><span data-emoji="">:happy:</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
