import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('millannetEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a hotlinked smiley', async () => {
    const value = html`
      <p>
        <img
          alt="From Millan.Net"
          border="0"
          src="http://www.millan.net/minimations/smileys/flower3.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="From Millan.Net"
          border="0"
          src="http://www.millan.net/minimations/smileys/flower3.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a smiley whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          alt="😀"
          src="http://www.millan.net/minimations/smileys/flower3.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="😀"
          src="http://www.millan.net/minimations/smileys/flower3.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an animation outside the smileys folder untouched', async () => {
    const value = html`
      <p>
        <img
          alt="From Millan.Net"
          border="0"
          src="http://www.millan.net/minimations/anims/smileblom.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a minimations folder on another host untouched', async () => {
    const value = html`
      <p>
        <img
          alt="From Millan.Net"
          src="https://example.com/minimations/smileys/flower3.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
