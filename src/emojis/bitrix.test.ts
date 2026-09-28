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

  it('should mark a smilie by a code the board added', async () => {
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
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/upload/main/smiles/5/11.gif"
          data-code="|do|"
          alt="|do|"
          title="Умираю от смеха"
          class="bx-smile"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // A pipe-smoking face, and no emoji has a pipe.
  it('should replace a smilie by a universal alt beside a false data-code', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/upload/main/smiles/5/11.gif"
          data-code="|do|"
          alt=":D"
          class="bx-smile"
        >
      </p>
    `
    const expected = '<p>😁</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

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

  // Codes from Bitrix's stock set that the shared table does not carry.
  const stockCodeCases: Array<string> = [':facepalm:', ':{}', ':-{}', ':~(', ':-/']

  // Bitrix draws `>:-<` on the same file as `:evil:`.
  const sharedCodeCases: Array<[string, string]> = [
    [':like:', 'bx_smile_like'],
    ['&gt;:-&lt;', 'bx_smile_evil'],
  ]

  it.each(sharedCodeCases)('should mark the stock %s code', async (code, file) => {
    const value = html`
      <p>
        <img
          src="https://example.com/bitrix/images/main/smiles/3/${file}.png"
          data-code="${code}"
          data-definition="SD"
          alt="${code}"
          class="bx-smile"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/bitrix/images/main/smiles/3/${file}.png"
          data-code="${code}"
          data-definition="SD"
          alt="${code}"
          class="bx-smile"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it.each(stockCodeCases)('should mark the stock %s code', async (code) => {
    const value = html`
      <p>
        <img
          src="https://example.com/upload/main/smiles/5/070.gif"
          data-code="${code}"
          data-definition="SD"
          alt="${code}"
          class="bx-smile"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/upload/main/smiles/5/070.gif"
          data-code="${code}"
          data-definition="SD"
          alt="${code}"
          class="bx-smile"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a smilie from the blog folder without the class', async () => {
    const value =
      '<p><img src="https://example.com/bitrix/images/blog/smile/icon_cool.gif" title="Здорово"></p>'
    const expected =
      '<p><img src="https://example.com/bitrix/images/blog/smile/icon_cool.gif" title="Здорово" data-emoji=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a smilie from the forum folder by its universal code alt', async () => {
    const value =
      '<p><img src="https://example.com/bitrix/images/forum/smile/icon_smile.gif" alt=":)"></p>'

    expect(await transform(value)).toEqualHtml('<p>🙂</p>')
  })
})
