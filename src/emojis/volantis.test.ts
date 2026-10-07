import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('volantisEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a sticker from the inline image tag', async () => {
    const value = html`
      <p>
        <img
          no-lazy
          class="inline"
          src="https://cdn.jsdelivr.net/gh/volantis-x/cdn-emoji/aru-l/0000.gif"
          style="height:1.5em"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          no-lazy=""
          class="inline"
          src="https://cdn.jsdelivr.net/gh/volantis-x/cdn-emoji/aru-l/0000.gif"
          style="height:1.5em"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a sticker with a Chinese filename', async () => {
    const value = html`
      <p>
        <img
          src="https://cdn.jsdelivr.net/gh/volantis-x/cdn-emoji/tieba/%E6%BB%91%E7%A8%BD.png"
          style="height:24px"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://cdn.jsdelivr.net/gh/volantis-x/cdn-emoji/tieba/%E6%BB%91%E7%A8%BD.png"
          style="height:24px"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the picture of a sticker whose alt is an emoji', async () => {
    const value = html`
      <p>
        <img
          src="https://fastly.jsdelivr.net/gh/volantis-x/cdn-emoji/aru/13.png"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://fastly.jsdelivr.net/gh/volantis-x/cdn-emoji/aru/13.png"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an image from another Volantis repository untouched', async () => {
    const value =
      '<p><img src="https://cdn.jsdelivr.net/gh/volantis-x/cdn-wallpaper/abstract/00E0F0ED-9F1C-407A-9AA6-545649D919F4.jpeg"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
