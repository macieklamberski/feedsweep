import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('notoEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an emoji whose alt is already the glyph', async () => {
    const value = html`
      <p>Done
        <img
          class="an1"
          src="https://fonts.gstatic.com/s/e/notoemoji/16.0/2705/32.png"
          alt="✅"
          data-emoji="✅"
        >
      </p>
    `
    const expected = '<p>Done ✅</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoji with an empty alt by its directory', async () => {
    const value = html`
      <p>
        <img src="https://fonts.gstatic.com/s/e/notoemoji/17.0/1f449/72.png" alt="">
      </p>
    `
    const expected = '<p>👉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode a sequence joined by underscores', async () => {
    const value = html`
      <p>
        <img src="https://fonts.gstatic.com/s/e/notoemoji/16.0/1f9d8_200d_2640_fe0f/32.png" alt="">
      </p>
    `
    const expected = '<p>🧘‍♀️</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
