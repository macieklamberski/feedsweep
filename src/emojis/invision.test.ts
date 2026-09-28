import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('invisionEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('IPS / Invision (data-emoticon + /uploads/emoticons/ path)', () => {
    it('should replace an emoticon whose alt is a shortcode', async () => {
      const value = html`
        <p>
          <img
            alt=":)"
            data-emoticon=""
            height="20"
            src="https://example.com/uploads/emoticons/default_smile.png"
            srcset="https://example.com/uploads/emoticons/smile@2x.png 2x"
            title=":)"
            width="20"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should resolve a stock filename once the default_ prefix is dropped', async () => {
      const value = html`
        <p>
          <img
            data-emoticon="true"
            src="https://example.com/uploads/emoticons/default_wink.png"
            alt=""
          >
        </p>
      `
      const expected = '<p>😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should resolve a filename carrying a resolution variant suffix', async () => {
      const value = html`
        <p>
          <img data-emoticon="" src="https://example.com/uploads/emoticons/biggrin@2x.png" alt="">
        </p>
      `
      const expected = '<p>😁</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a site-custom emoticon with its working image', async () => {
      const value = html`
        <p>
          <img alt=":yahoo:" data-emoticon="" src="https://example.com/uploads/emoticons/yahoo.png">
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('IPS / Invision lazy emoticon (spacer.png src + data-src)', () => {
    it('should replace an emoticon whose alt is a shortcode', async () => {
      const value = html`
        <p>Thanks
          <img
            alt=":)"
            src="https://example.com/forum/applications/core/interface/js/spacer.png"
            data-src="https://example.com/forum/uploads/emoticons/fpn_smile.png"
          >
        </p>
      `
      const expected = '<p>Thanks 🙂</p>'

      expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
    })

    it('should resolve a stock filename behind a data-emoticon marker', async () => {
      const value = html`
        <p>Thanks
          <img
            alt=""
            data-emoticon=""
            src="https://example.com/applications/core/interface/js/spacer.png"
            data-src="https://example.com/uploads/emoticons/default_wink.png"
          >
        </p>
      `
      const expected = '<p>Thanks 😉</p>'

      expect(await transformContent(value, { parseHtmlFn: parseHtml })).toEqualHtml(expected)
    })
  })

  it('should replace an IPS 4 emoji by its ipsEmoji class', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/uploads/emoji/1f602.png"
          class="ipsEmoji"
          alt="😂"
        >
      </p>
    `
    const expected = '<p>😂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an IPB 2 emoticon by the universal code in its emoid', async () => {
    const value =
      '<p><img src="https://example.com/forum/style_emoticons/default/ohmy.gif" emoid=":o" alt="ohmy.gif"></p>'

    expect(await transform(value)).toEqualHtml('<p>😲</p>')
  })

  it('should mark an IPB 2 emoticon whose emoid holds a board code', async () => {
    const value =
      '<p><img src="https://example.com/images/bow.gif" emoid=":bow:" alt="bow.gif"></p>'
    const expected =
      '<p><img data-emoji="" src="https://example.com/images/bow.gif" emoid=":bow:" alt="bow.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
