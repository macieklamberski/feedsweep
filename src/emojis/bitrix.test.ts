import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('bitrixEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace a smilie by the shortcode in data-code', async () => {
    const value = html`
      <p>Hello
        <img
          src="https://example.com/upload/main/smiles/5/ab.gif"
          data-code=":)"
          data-definition="SD"
          alt=":)"
          title="С улыбкой"
          class="bx-smile"
        >
      </p>
    `
    const expected = '<p>Hello 🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a smilie by its alt when data-code is missing', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/bitrix/images/main/smiles/3/bx_smile_wink.png"
          alt=";)"
          class="bx-smile"
        >
      </p>
    `
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a smilie by a code the board added', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/upload/main/smiles/5/11.gif"
          data-code="|do|"
          alt="|do|"
          title="Умираю от смеха"
          class="bx-smile"
        >
      </p>
    `
    const expected = '<p>🤣</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // A pipe-smoking face, and no emoji has a pipe.
  it('should mark a smilie whose code has no counterpart', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/upload/main/smiles/5/180.gif"
          data-code=":S:"
          alt=":S:"
          title="Трубка"
          class="bx-smile"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/upload/main/smiles/5/180.gif"
          data-code=":S:"
          alt=":S:"
          title="Трубка"
          class="bx-smile"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
