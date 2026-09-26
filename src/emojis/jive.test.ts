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

  // Jive's stock names that neither the shortcode table nor gemoji carries.
  const jiveNameCases: Array<[string, string]> = [
    ['happy', '🙂'],
    ['silly', '😛'],
    ['laugh', '🤣'],
    ['shocked', '😲'],
    ['plain', '😐'],
    ['mischief', '😏'],
  ]

  it.each(jiveNameCases)('should replace the macro by the Jive name %s', async (name, glyph) => {
    const value = html`
      <p>
        <span
          __jive_emoticon_name="${name}"
          __jive_macro_name="emoticon"
          class="jive_macro jive_emote"
          src="https://example.com/4.5.4/images/emoticons/${name}.gif"
        ></span>
      </p>
    `

    expect(await transform(value)).toEqualHtml(`<p>${glyph}</p>`)
  })

  it('should mark a Jive name no table carries as fallback text', async () => {
    const value = html`
      <p>
        <span
          __jive_emoticon_name="info"
          __jive_macro_name="emoticon"
          class="jive_macro jive_emote"
          src="https://example.com/4.5.4/images/emoticons/info.gif"
        ></span>
      </p>
    `
    const expected = '<p><span data-emoji="">:info:</span></p>'

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

    it.each(jiveNameCases)('should replace the span by the Jive name %s', async (name, glyph) => {
      const value = `<p><span class="emoticon-inline emoticon_${name}"></span></p>`

      expect(await transform(value)).toEqualHtml(`<p>${glyph}</p>`)
    })

    // The Facebook classic resolver also selects an `emoticon_<name>` span, and would leave the
    // bare name as text.
    it('should mark a name no table carries as fallback text', async () => {
      const value = '<p><span class="emoticon-inline emoticon_info"></span></p>'
      const expected = '<p><span data-emoji="">:info:</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
