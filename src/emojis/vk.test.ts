import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('vkEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an emoji whose alt is already the glyph', async () => {
    const value = html`
      <p>Look
        <img
          alt="👉"
          class="emoji"
          src="https://vk.com/emoji/e/f09f9189.png"
        >
      </p>
    `
    const expected = '<p>Look 👉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoji with an empty alt by its UTF-8 filename', async () => {
    const value = '<p><img alt="" src="https://vk.com/emoji/e/f09f92a5.png"></p>'
    const expected = '<p>💥</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode a three-byte glyph from the Basic Multilingual Plane', async () => {
    const value = '<p><img alt="" src="https://vk.com/emoji/e/e29c85.png"></p>'
    const expected = '<p>✅</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an image whose filename is not valid UTF-8', async () => {
    const value = '<p><img alt="" src="https://vk.com/emoji/e/f09f.png"></p>'
    const expected = '<p><img data-emoji="" alt="" src="https://vk.com/emoji/e/f09f.png"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoji from the .ru domain', async () => {
    const value = '<p><img alt="" src="https://vk.ru/emoji/e/e29c85.png"></p>'
    const expected = '<p>✅</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  describe('older set', () => {
    it('should decode a surrogate pair filename', async () => {
      const value = html`
        <p>
          <img alt="D83DDC47.png (16×16)" src="https://m.vk.com/images/emoji/D83DDC47.png">
        </p>
      `
      const expected = '<p>👇</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should decode a filename from the Basic Multilingual Plane', async () => {
      const value = '<p><img alt="" src="https://vk.com/images/emoji/26A1.png"></p>'
      const expected = '<p>⚡</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an image whose filename is half a surrogate pair', async () => {
      const value = '<p><img alt="" src="https://vk.com/images/emoji/D83D.png"></p>'
      const expected =
        '<p><img data-emoji="" alt="" src="https://vk.com/images/emoji/D83D.png"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an image whose filename carries more than code units', async () => {
      const value = '<p><img alt="" src="https://vk.com/images/emoji/D83DDE0A_2x.png"></p>'
      const expected =
        '<p><img data-emoji="" alt="" src="https://vk.com/images/emoji/D83DDE0A_2x.png"></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // The sprite is a blank GIF painted by VK's CSS, so it shows nothing in a reader.
    it('should replace a sprite image by its alt', async () => {
      const value = html`
        <p>Love
          <img
            alt="❤"
            class="emoji_css"
            emoji="2764"
            src="https://vk.com/images/blank.gif"
          >
        </p>
      `
      const expected = '<p>Love ❤</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should decode the emoji attribute of a sprite image with an empty alt', async () => {
      const value = html`
        <p>
          <img
            alt=""
            class="emoji_css"
            emoji="D83DDE06"
            src="https://vk.com/images/blank.gif"
          >
        </p>
      `
      const expected = '<p>😆</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
