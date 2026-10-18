import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('smileycentralEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a hotlinked smiley', async () => {
    const value = html`
      <p>
        <img
          border="0"
          alt="Bounce"
          src="http://smileys.smileycentral.com/cat/36/36_1_13.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          border="0"
          alt="Bounce"
          src="http://smileys.smileycentral.com/cat/36/36_1_13.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a smiley hotlinked from the Japanese edition', async () => {
    const value = html`
      <p>
        <img
          alt="お辞儀"
          src="http://ak.images.smileycentral.jp/cat/jd/135.gif"
          border="0"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="お辞儀"
          src="http://ak.images.smileycentral.jp/cat/jd/135.gif"
          border="0"
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
          src="http://smileys.smileycentral.com/cat/36/36_1_13.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="😀"
          src="http://smileys.smileycentral.com/cat/36/36_1_13.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a signature banner from the same site untouched', async () => {
    const value = html`
      <p>
        <img
          border="0"
          src="http://www.smileycentral.com/sig.jsp?pc=ZSzeb112&amp;pp=ZNxdm824NYUS"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a signature banner from the Japanese edition untouched', async () => {
    const value = html`
      <p>
        <img
          src="http://www.smileycentral.jp/ajj-sig/sig.jsp?pc=JSzeb043&amp;pp=JSV0AJJ004"
          border="0"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a cat folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/cat/36/36_1_13.gif" alt="Bounce"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
