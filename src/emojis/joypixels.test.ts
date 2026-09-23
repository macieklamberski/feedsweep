import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('joypixelsEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('JoyPixels CDN', () => {
    it('should replace an image whose alt is already the glyph', async () => {
      const value = html`
        <p>
          <img
            src="https://cdn.jsdelivr.net/joypixels/assets/6.6/png/unicode/64/1f642.png"
            alt="🙂"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an image whose alt is a shortcode in the table', async () => {
      const value = html`
        <p>
          <img
            src="https://cdn.jsdelivr.net/joypixels/assets/6.6/png/unicode/64/1f642.png"
            class="smilie smilie--emoji"
            alt=":)"
            data-shortname=":)"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should decode the filename when the alt is empty', async () => {
      const value = html`
        <p>
          <img
            src="https://cdn.jsdelivr.net/joypixels/assets/6.6/png/unicode/64/1f1fa-1f1f8.png"
            alt=""
          >
        </p>
      `
      const expected = '<p>🇺🇸</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an unhosted image with a codepoint filename untouched', async () => {
      const value = '<p><img src="https://forum.example.com/assets/1f642.png" alt=":nope:"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('hosts', () => {
    const hosts = ['cdn.jsdelivr.net/joypixels/assets/']

    it.each(hosts)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
