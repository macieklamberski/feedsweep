import { expect, it } from 'bun:test'
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
})
