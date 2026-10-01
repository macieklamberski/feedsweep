import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('tinymceEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('TinyMCE 3 (/plugins/emotions/img/ names)', () => {
    // Misspelled in the distribution.
    it('should mark the embarassed face', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-embarassed.gif"
            class="flag"
            alt=""
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/editors/tiny_mce_3_4_3_1/plugins/emotions/img/smiley-embarassed.gif"
            class="flag"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('older copies (/plugins/emotions/images/)', () => {
    it('should mark a stock face', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/wp-includes/js/tinymce/plugins/emotions/images/smiley-smile.gif"
            alt="Sourire"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/wp-includes/js/tinymce/plugins/emotions/images/smiley-smile.gif"
            alt="Sourire"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a board file with an unknown name untouched', async () => {
      const value =
        '<p><img src="https://example.com/tinymce/plugins/emotions/images/b2.gif" alt="emoticone"></p>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })
})
