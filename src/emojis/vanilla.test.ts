import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('vanillaEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  // Vanilla ships the stock forum names beside gemoji's, so its set keeps its pictures. The
  // directory is a weak match, so only a known name is marked.
  describe('known names', () => {
    it('should mark a file named by gemoji', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/resources/emoji/smile.png"
            title=":smile:"
            alt=":smile:"
            height="20"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="emoji"
            src="https://example.com/resources/emoji/smile.png"
            title=":smile:"
            alt=":smile:"
            height="20"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a name gemoji does not know by the forum names', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/resources/emoji/simple-smile.png"
            alt=":simple-smile:"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="emoji"
            src="https://example.com/resources/emoji/simple-smile.png"
            alt=":simple-smile:"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a gemoji file whose alt is a false code', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/resources/emoji/sunglasses.png"
            title="B)"
            alt="B)"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/resources/emoji/sunglasses.png"
            title="B)"
            alt="B)"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark trollface, which has no Unicode glyph', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/resources/emoji/trollface.png"
            alt=":trollface:"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="emoji"
            src="https://example.com/resources/emoji/trollface.png"
            alt=":trollface:"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should leave an unknown file in the directory untouched', async () => {
    const value = '<p><img src="https://example.com/resources/emoji/banner-wide.png" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
