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

  describe('EmojiOne', () => {
    it('should decode the filename when the alt is empty', async () => {
      const value = html`
        <p>
          <img src="https://cdn.jsdelivr.net/emojione/assets/png/1f337.png?v=2.2.7" alt="">
        </p>
      `
      const expected = '<p>🌷</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Mastodon's class, which EmojiOne's own toImage writes too.
    it('should decode the filename of an image carrying the emojione class', async () => {
      const value = html`
        <p>
          <img
            class="emojione"
            alt=""
            src="https://cdn.jsdelivr.net/emojione/assets/svg/1f602.svg"
          >
        </p>
      `
      const expected = '<p>😂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('hosts', () => {
    const hosts = ['cdn.jsdelivr.net/joypixels/assets/', 'cdn.jsdelivr.net/emojione/']

    it.each(hosts)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
