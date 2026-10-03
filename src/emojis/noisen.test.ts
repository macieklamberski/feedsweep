import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('noisenEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a smiley with a Noisen code', async () => {
    const value = html`
      <p>
        <img
          src="http://noisen.com/Smileys/cyna/mdr3.gif"
          alt=":mdr:"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="http://noisen.com/Smileys/cyna/mdr3.gif"
          alt=":mdr:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a noisen.com path on another host untouched', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/noisen.com/Smileys/cyna/mdr3.gif"
          alt=":mdr:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
