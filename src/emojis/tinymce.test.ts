import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('tinymceEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('TinyMCE 3 (/plugins/emotions/img/ names)', () => {
    const nameCases: Array<[string, string]> = [
      ['sealed', '🤐'],
      ['embarassed', '😳'],
      ['tongue-out', '😛'],
      ['money-mouth', '🤑'],
    ]

    it.each(nameCases)('should replace the %s face', async (name, expected) => {
      const value = html`
        <p>
          <img
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-${name}.gif"
            class="flag"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${expected}</p>`)
    })

    it('should mark the foot-in-mouth face', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-foot-in-mouth.gif"
            class="flag"
            alt="Foot in mouth"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-foot-in-mouth.gif"
            class="flag"
            alt="Foot in mouth"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
