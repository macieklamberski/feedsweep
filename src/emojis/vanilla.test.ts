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

  // EmojiExtender names its files by Vanilla's own names, like `grin` for `:D`, so its sets keep
  // their pictures too. Its directory holds only emoji, so a forum's own set is marked as well.
  describe('EmojiExtender sets', () => {
    it('should mark a stock file', async () => {
      const value = html`
        <p>
          <img
            src="https://lowendspirit.com/plugins/emojiextender/emoji/twitter/grin.png"
            title=":D"
            alt=":D"
            height="18"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://lowendspirit.com/plugins/emojiextender/emoji/twitter/grin.png"
            title=":D"
            alt=":D"
            height="18"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a file of a set the forum added', async () => {
      const value = html`
        <p>
          <img
            src="https://forumliliorum.com/plugins/EmojiExtender/emoji/dotl/Thistle.png"
            title=":Thistle:"
            alt=":Thistle:"
            height="32"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://forumliliorum.com/plugins/EmojiExtender/emoji/dotl/Thistle.png"
            title=":Thistle:"
            alt=":Thistle:"
            height="32"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should convert a codepoint filename', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/plugins/emojiextender/emoji/twitter/1f600.png"
            alt=":grinning:"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml('<p>😀</p>')
    })

    it('should leave the set preview beside the sets untouched', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/plugins/emojiextender/emoji_set.png"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  it('should leave an unknown file in the directory untouched', async () => {
    const value = '<p><img src="https://example.com/resources/emoji/banner-wide.png" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
