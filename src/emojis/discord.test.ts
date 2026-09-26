import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('discordEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a server emoji whose alt is its shortcode', async () => {
    const value = html`
      <p>
        <img
          src="https://cdn.discordapp.com/emojis/449171648310935553.webp?size=44"
          alt=":servericon:"
          class="jsResizeImage"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://cdn.discordapp.com/emojis/449171648310935553.webp?size=44"
          alt=":servericon:"
          class="jsResizeImage"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a server emoji with an empty alt', async () => {
    const value = html`
      <p>
        <img src="https://cdn.discordapp.com/emojis/924649887096770590.webp?size=20" alt="">
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://cdn.discordapp.com/emojis/924649887096770590.webp?size=20"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
