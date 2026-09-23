import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('githubEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('GitHub (gemoji README scrapings)', () => {
    it('should replace GitHub gemoji image when alt is the emoji glyph', async () => {
      const value = html`
        <p>
          <img
            src="https://github.githubassets.com/images/icons/emoji/unicode/1f680.png"
            alt="🚀"
          >
        </p>
      `
      const expected = '<p>🚀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should decode the filename when the alt is a shortcode', async () => {
      const value = html`
        <p>
          <img
            src="https://github.githubassets.com/images/icons/emoji/unicode/1f680.png"
            alt=":rocket:"
          >
        </p>
      `
      const expected = '<p>🚀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('hosts', () => {
    const hosts = ['githubassets.com/images/icons/emoji/', 'assets.github.com/images/icons/emoji/']

    it.each(hosts)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
