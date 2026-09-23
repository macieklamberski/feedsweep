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

    // A host match alone does not make the vocabulary known, so a CDN image never reaches the
    // filename table and the codepoint route with it.
    it('should leave a host-matched image with no usable alt alone', async () => {
      const value = html`
        <p>
          <img
            src="https://cdn.jsdelivr.net/joypixels/assets/6.6/png/unicode/64/1f1fa-1f1f8.png"
            alt=""
          >
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
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
