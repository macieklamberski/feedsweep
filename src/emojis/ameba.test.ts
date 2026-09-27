import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('amebaEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('Ameba (ucs char and author-uploaded emoji paths)', () => {
    // The alt is the Japanese name of the picture, not a shortcode and not a glyph, so there is
    // nothing to convert either set to.
    it('should leave a built-in char image with its picture', async () => {
      const value = html`
        <p>
          <img src="https://stat100.ameba.jp/blog/ucs/img/char/char3/084.png" alt="ラブラブ" width="24" height="24">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave a built-in char image served from the c subdomain with its picture', async () => {
      const value = html`
        <p>
          <img src="https://c.stat100.ameba.jp/blog/ucs/img/char/char4/610.png" alt="ニヤニヤ" width="24" height="24">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should mark a built-in char image served from the older host', async () => {
      const value = html`
        <p>
          <img src="https://stat.ameba.jp/blog/ucs/img/char/char2/002.gif" alt="ニコニコ">
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://stat.ameba.jp/blog/ucs/img/char/char2/002.gif"
            alt="ニコニコ"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an author-uploaded emoji with its picture', async () => {
      const value = html`
        <p>
          <img src="https://emoji.ameba.jp/img/user/ho/hokkokuamaebi/4409391.gif" alt="ベルギー" border="0">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should not touch an ordinary post image on the same domain', async () => {
      const value = html`
        <p>
          <img src="https://stat.ameba.jp/user_images/20220822/15/rci-kobe/39/39/j/o10801204.jpg" alt="">
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })
})
