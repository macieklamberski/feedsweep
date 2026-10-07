import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('jugemEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram with no class or alt', async () => {
    const value = '<p><img src="https://picto0.jugem.jp/emoji/j_082.gif"></p>'
    const expected = '<p><img data-emoji="" src="https://picto0.jugem.jp/emoji/j_082.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a pictogram whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="https://picto0.jugem.jp/emoji/j_082.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://picto0.jugem.jp/emoji/j_082.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
