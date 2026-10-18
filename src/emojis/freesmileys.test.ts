import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('freesmileysEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a hotlinked smiley', async () => {
    const value = html`
      <p>
        <img
          alt="Smiley"
          border="0"
          src="http://www.freesmileys.org/smileys/smiley-computer001.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="Smiley"
          border="0"
          src="http://www.freesmileys.org/smileys/smiley-computer001.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a hotlinked emoticon', async () => {
    const value = html`
      <p>
        <img
          alt="Emoticon"
          border="0"
          src="http://www.freesmileys.org/emoticons/emoticon-cute-004.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="Emoticon"
          border="0"
          src="http://www.freesmileys.org/emoticons/emoticon-cute-004.gif"
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
          src="http://www.freesmileys.org/smileys/smiley-computer001.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="😀"
          src="http://www.freesmileys.org/smileys/smiley-computer001.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a smileys folder on another host untouched', async () => {
    const value = html`
      <p>
        <img
          alt="Smiley"
          src="https://example.com/smileys/smiley-computer001.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
