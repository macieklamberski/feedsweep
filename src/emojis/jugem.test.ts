import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('jugemEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram a blog uploaded', async () => {
    const value = html`
      <p>
        <img
          align="absmiddle"
          alt="星"
          border="0"
          src="http://picto0.jugem.jp/w/i/n/wintersmile/d3a5ebc658cd71ce0f5da970457809e1.gif"
          title="星"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          align="absmiddle"
          alt="星"
          border="0"
          src="http://picto0.jugem.jp/w/i/n/wintersmile/d3a5ebc658cd71ce0f5da970457809e1.gif"
          title="星"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep an uploaded pictogram whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          align="absmiddle"
          alt="&#8252;"
          border="0"
          class="emoji"
          src="http://picto0.jugem.jp/m/a/r/marin0216/0ba577e5a05a711d2c8f2c89fa7071f5.gif"
          title="&#8252;"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          align="absmiddle"
          alt="&#8252;"
          border="0"
          class="emoji"
          src="http://picto0.jugem.jp/m/a/r/marin0216/0ba577e5a05a711d2c8f2c89fa7071f5.gif"
          title="&#8252;"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an image whose path only names the host untouched', async () => {
    const value = '<p><img src="https://example.com/picto0.jugem.jp/emoji/j_082.gif"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should mark a pictogram with no class or alt', async () => {
    const value = '<p><img src="https://picto0.jugem.jp/emoji/j_082.gif"></p>'
    const expected = '<p><img data-emoji="" src="https://picto0.jugem.jp/emoji/j_082.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
