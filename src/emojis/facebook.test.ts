import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('facebookEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('Facebook (embedded posts)', () => {
    it('should replace Facebook emoji image', async () => {
      const value = html`
        <p>
          <img
            height="16"
            width="16"
            alt="🙂"
            referrerpolicy="origin-when-cross-origin"
            src="https://static.xx.fbcdn.net/images/emoji.php/v9/t4c/1/16/1f642.png"
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
            alt=""
            src="https://static.xx.fbcdn.net/images/emoji.php/v9/t4c/1/16/1f642.png"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('hosts', () => {
    const hosts = ['fbcdn.net/images/emoji.php/', 'www.facebook.com/images/emoji.php/']

    it.each(hosts)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
