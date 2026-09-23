import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('maxEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an emoji whose alt is already the glyph', async () => {
    const value = '<p>Go <img alt="🚀" src="https://st.max.ru/emojis/1F680_48.webp"></p>'
    const expected = '<p>Go 🚀</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoji whose alt is "?" by its filename', async () => {
    const value = '<p><img src="https://st.max.ru/emojis/1F7E2_48.webp" alt="?"></p>'
    const expected = '<p>🟢</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode a filename holding several codepoints', async () => {
    const value = '<p><img src="https://st.max.ru/emojis/1F1F7-1F1FA_32.webp" alt=""></p>'
    const expected = '<p>🇷🇺</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
